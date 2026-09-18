import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { mailboxes, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { ensureMailboxDomainRouting, removeMailboxDomainRouting } from "@/lib/mailboxes/domain-addresses";
import { isPrimaryMailbox, tracksAccountIdentity } from "@/lib/profile/identity-utils";
import { syncPersonalIdentity } from "@/lib/profile/sync";
import { updateMailboxSchema } from "@/lib/validators";
import type { MailboxRouteParams } from "./types";
import { getMailboxUpdateValues, selectMailboxForUser } from "./utils";

export async function GET(request: Request, { params }: MailboxRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, id);
	if (!access?.canRead) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}
	const [mailbox] = await selectMailboxForUser(db, user.id, id);

	if (!mailbox) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}
	const { avatarKey, ownerName, ownerAvatarKey, ...mailboxDetails } = mailbox;
	const identity = tracksAccountIdentity(mailbox, user.email);

	return NextResponse.json({
		mailbox: {
			...mailboxDetails,
			displayName: identity ? ownerName : mailbox.displayName,
			hasAvatar: identity ? !!ownerAvatarKey : !!avatarKey,
			permission: access.permission,
			isPrimary: isPrimaryMailbox(mailbox, user.email),
		},
	});
}

export async function PATCH(request: Request, { params }: MailboxRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const parsed = updateMailboxSchema.safeParse(await request.json());

	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, id);
	const [existing] = await selectMailboxForUser(db, user.id, id);

	if (!existing || !access?.canManage) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}

	const updateValues = getMailboxUpdateValues(parsed.data);
	// Only the primary mailbox carries the account name; renaming any other
	// mailbox writes to that mailbox alone.
	if (tracksAccountIdentity(existing, user.email) && "displayName" in parsed.data) {
		const name = parsed.data.displayName?.trim();
		if (!name) {
			return NextResponse.json({ error: "A valid account name is required" }, { status: 400 });
		}
		await syncPersonalIdentity(db, {
			userId: existing.userId,
			name,
			avatarKey: existing.ownerAvatarKey,
		});
		delete updateValues.displayName;
	}
	if (parsed.data.useAllDomains === true) {
		try {
			await ensureMailboxDomainRouting(env, db, {
				id: existing.id,
				domainId: existing.domainId,
				localPart: existing.localPart,
				useAllDomains: true,
			});
		} catch (error) {
			console.error("ensureMailboxDomainRouting", error);
			return NextResponse.json(
				{ error: "Failed to configure inbound routing for all domains. Please try saving again." },
				{ status: 502 },
			);
		}
	}
	if (Object.keys(updateValues).length > 0) {
		await db
			.update(mailboxes)
			.set(updateValues)
			.where(eq(mailboxes.id, id));
	}

	const [mailbox] = await selectMailboxForUser(db, user.id, id);
	const { avatarKey, ownerName, ownerAvatarKey, ...mailboxDetails } = mailbox!;
	const identity = tracksAccountIdentity(mailbox!, user.email);

	return NextResponse.json({
		mailbox: {
			...mailboxDetails,
			displayName: identity ? ownerName : mailbox!.displayName,
			hasAvatar: identity ? !!ownerAvatarKey : !!avatarKey,
			permission: access.permission,
			isPrimary: isPrimaryMailbox(mailbox!, user.email),
		},
	});
}

export async function DELETE(request: Request, { params }: MailboxRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, id)).limit(1);
	if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

	let allowed = mailbox.userId === user.id && user.canManageMailboxes;
	if (!allowed && user.role === "admin") {
		const [owner] = await db.select({ createdByUserId: users.createdByUserId }).from(users).where(eq(users.id, mailbox.userId)).limit(1);
		allowed = mailbox.userId === user.id || owner?.createdByUserId === user.id;
	}
	if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	try {
		await removeMailboxDomainRouting(env, db, {
			id: mailbox.id,
			domainId: mailbox.domainId,
			localPart: mailbox.localPart,
			useAllDomains: mailbox.useAllDomains,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to remove Cloudflare routing rule";
		return NextResponse.json({ error: message }, { status: 502 });
	}

	await db.delete(mailboxes).where(eq(mailboxes.id, id));
	return NextResponse.json({ ok: true });
}
