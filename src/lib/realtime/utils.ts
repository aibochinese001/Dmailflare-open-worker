import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains, mailboxAccess, mailboxes } from "@/db/schema";
import { isTeamMailboxSharingEnabled } from "@/lib/mailboxes/access-utils";
import type { NewMessageNotification } from "./types";

export function getSessionTokenFromRequest(request: Request): string | undefined {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return undefined;

	for (const part of cookie.split(";")) {
		const [name, ...valueParts] = part.trim().split("=");
		if (name === "ep_session") {
			const value = valueParts.join("=");
			return value ? decodeURIComponent(value) : undefined;
		}
	}

	return undefined;
}

export async function getMailboxNotificationUserIds(
	env: CloudflareEnv,
	mailboxId: string,
	ownerUserId: string,
): Promise<string[]> {
	const db = getDb(env);
	const mailboxRows = await db
		.select({ domainOwnerUserId: domains.userId, type: mailboxes.type })
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.where(eq(mailboxes.id, mailboxId))
		.limit(1);
	const sharedUserIds = mailboxRows[0]?.type === "shared" && await isTeamMailboxSharingEnabled(db)
		? (await db
			.select({ userId: mailboxAccess.userId })
			.from(mailboxAccess)
			.where(eq(mailboxAccess.mailboxId, mailboxId)))
			.map((access) => access.userId)
		: [];

	return [
		...new Set([
			ownerUserId,
			mailboxRows[0]?.domainOwnerUserId,
			...sharedUserIds,
		].filter((userId): userId is string => !!userId)),
	];
}

export async function notifyUsersOfNewMessage(
	env: CloudflareEnv,
	userIds: string[],
	payload: NewMessageNotification,
): Promise<void> {
	await Promise.allSettled(
		userIds.map((userId) => {
			const hub = env.REALTIME.getByName(userId);
			return hub.fetch("https://mailflare-realtime/notify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		}),
	);
}
