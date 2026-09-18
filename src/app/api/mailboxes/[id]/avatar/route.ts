import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import {
	ALLOWED_AVATAR_TYPES,
	MAX_AVATAR_SIZE,
	avatarKeyFor,
	isUploadedAvatarFile,
} from "@/app/api/profile/avatar/utils";
import { tracksAccountIdentity } from "@/lib/profile/identity-utils";
import { syncPersonalIdentity } from "@/lib/profile/sync";
import type { MailboxAvatarRouteParams } from "./types";
import { mailboxAvatarKeyFor } from "./utils";

export async function GET(request: Request, { params }: MailboxAvatarRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, id);
	if (!access?.canRead) return new Response("Not found", { status: 404 });

	const [mailbox] = await db
		.select({
			avatarKey: mailboxes.avatarKey,
			type: mailboxes.type,
			localPart: mailboxes.localPart,
			hostname: domains.hostname,
			ownerEmail: users.email,
			ownerAvatarKey: users.avatarKey,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.innerJoin(users, eq(mailboxes.userId, users.id))
		.where(eq(mailboxes.id, id))
		.limit(1);
	const avatarKey = mailbox && tracksAccountIdentity(mailbox, mailbox.ownerEmail)
		? mailbox.ownerAvatarKey
		: mailbox?.avatarKey;
	if (!avatarKey) return new Response("Not found", { status: 404 });

	const object = await env.BUCKET.get(avatarKey);
	if (!object) return new Response("Not found", { status: 404 });

	const headers = new Headers();
	headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
	headers.set("Cache-Control", "private, no-cache");
	return new Response(object.body, { headers });
}

export async function POST(request: Request, { params }: MailboxAvatarRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, id);
	if (!access?.canManage) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
	}
	const file = form.get("file");
	if (!isUploadedAvatarFile(file)) {
		return NextResponse.json({ error: "Missing image file" }, { status: 400 });
	}
	if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
		return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image" }, { status: 400 });
	}
	if (file.size > MAX_AVATAR_SIZE) {
		return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 413 });
	}

	const [mailbox] = await db
		.select({
			userId: mailboxes.userId,
			type: mailboxes.type,
			localPart: mailboxes.localPart,
			hostname: domains.hostname,
			ownerName: users.name,
			ownerEmail: users.email,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.innerJoin(users, eq(mailboxes.userId, users.id))
		.where(eq(mailboxes.id, id))
		.limit(1);
	if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

	// The primary mailbox shares the account avatar; every other mailbox stores its own.
	const identity = tracksAccountIdentity(mailbox, mailbox.ownerEmail);
	const key = identity ? avatarKeyFor(mailbox.userId) : mailboxAvatarKeyFor(id);
	await env.BUCKET.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});
	if (identity) {
		await syncPersonalIdentity(db, {
			userId: mailbox.userId,
			name: mailbox.ownerName,
			avatarKey: key,
		});
	} else {
		await db.update(mailboxes).set({ avatarKey: key }).where(eq(mailboxes.id, id));
	}
	return NextResponse.json({ ok: true });
}
