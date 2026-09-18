import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/auth/password";
import { deleteUserSessions, hashSessionToken } from "@/lib/auth/session";
import { getBranding } from "@/lib/branding/service";
import { sendSystemEmail } from "@/lib/email/system-mail";
import { createAuditLog } from "@/lib/mailboxes/audit";
import { escapeHtml } from "@/lib/auth/password-reset-utils";

const TOKEN_MINUTES = 30;

/**
 * Mail a reset link to the account's recovery address. Silent about whether
 * the account exists or has one: the caller always answers the same way, so
 * the form cannot be used to probe for addresses.
 */
export async function requestPasswordReset(env: CloudflareEnv, email: string, origin: string): Promise<void> {
	const db = getDb(env);
	const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
	if (!user || user.disabled || !user.resetEmail) return;

	const token = newId("prt");
	await db.insert(passwordResetTokens).values({
		id: newId(),
		userId: user.id,
		tokenHash: await hashSessionToken(token),
		expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60 * 1000),
	});

	const link = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
	const { appName } = await getBranding(env);
	const sent = await sendSystemEmail(env, {
		to: user.resetEmail,
		subject: `Reset your ${appName} password`,
		text: [
			`Someone asked to reset the password for ${user.email} on ${appName}.`,
			"",
			`Open this link within ${TOKEN_MINUTES} minutes to choose a new password:`,
			link,
			"",
			"If that was not you, you can ignore this message; the password stays as it is.",
		].join("\n"),
		html: `<p>Someone asked to reset the password for <b>${escapeHtml(user.email)}</b> on ${escapeHtml(appName)}.</p><p>Open this link within ${TOKEN_MINUTES} minutes to choose a new password:</p><p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p><p>If that was not you, you can ignore this message; the password stays as it is.</p>`,
	});
	if (!sent) console.warn("Password reset requested but no domain can send mail; link not delivered");
}

/** Redeem a link: sets the password, burns the token, and signs the user out everywhere. */
export async function completePasswordReset(
	env: CloudflareEnv,
	token: string,
	newPassword: string,
	request: Request,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const db = getDb(env);
	const [row] = await db
		.select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
		.from(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, await hashSessionToken(token)),
				gt(passwordResetTokens.expiresAt, new Date()),
				isNull(passwordResetTokens.usedAt),
			),
		)
		.limit(1);
	if (!row) return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };

	await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, row.userId));
	await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
	await deleteUserSessions(env, row.userId);
	await createAuditLog(env, {
		actorUserId: row.userId,
		targetUserId: row.userId,
		action: "auth.password_reset",
		metadata: { ipAddress: request.headers.get("cf-connecting-ip") ?? "unknown" },
	});
	return { ok: true };
}
