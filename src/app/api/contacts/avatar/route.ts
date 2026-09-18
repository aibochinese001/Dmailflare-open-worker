import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getContactId } from "@/lib/contacts/utils";
import { normalizeEmailAddress } from "@/lib/email/address";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import {
	ALLOWED_AVATAR_TYPES,
	MAX_AVATAR_SIZE,
	avatarKeyFor,
	isUploadedAvatarFile,
} from "@/app/api/profile/avatar/utils";
import { getPersonalIdentityForAddress, syncPersonalIdentity } from "@/lib/profile/sync";
import { contactAvatarKeyFor } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	const email = normalizeEmailAddress(url.searchParams.get("address") ?? "");
	if (!mailboxId || !email) return new Response("Not found", { status: 404 });

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, mailboxId);
	if (!access?.canRead) return new Response("Not found", { status: 404 });
	const account = await getPersonalIdentityForAddress(db, access.mailbox.userId, email);
	const [contact] = await db
		.select({ avatarKey: contacts.avatarKey })
		.from(contacts)
		.where(and(eq(contacts.userId, access.mailbox.userId), eq(contacts.email, email)))
		.limit(1);
	const avatarKey = account ? account.avatarKey : contact?.avatarKey;
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

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
	}
	const mailboxEntry = form.get("mailboxId");
	const addressEntry = form.get("address");
	const mailboxId = typeof mailboxEntry === "string" ? mailboxEntry : "";
	const email = normalizeEmailAddress(typeof addressEntry === "string" ? addressEntry : "");
	const file = form.get("file");
	if (!mailboxId || !email || !isUploadedAvatarFile(file)) {
		return NextResponse.json({ error: "Mailbox, contact, and image file are required" }, { status: 400 });
	}
	if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
		return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image" }, { status: 400 });
	}
	if (file.size > MAX_AVATAR_SIZE) {
		return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 413 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, mailboxId);
	if (!access?.canManage) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	const account = await getPersonalIdentityForAddress(db, access.mailbox.userId, email);
	if (account) {
		if (account.userId !== user.id) {
			return NextResponse.json({ error: "Only the account owner can change this contact" }, { status: 403 });
		}
		const key = avatarKeyFor(account.userId);
		await env.BUCKET.put(key, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type },
		});
		await syncPersonalIdentity(db, { ...account, avatarKey: key });
		return NextResponse.json({ ok: true });
	}
	const [existing] = await db
		.select({ id: contacts.id })
		.from(contacts)
		.where(and(eq(contacts.userId, access.mailbox.userId), eq(contacts.email, email)))
		.limit(1);
	if (!existing) {
		await db.insert(contacts).values({
			id: getContactId(access.mailbox.userId, email),
			userId: access.mailbox.userId,
			email,
			source: "manual",
		});
	}

	const key = contactAvatarKeyFor(access.mailbox.userId, email);
	await env.BUCKET.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});
	await db
		.update(contacts)
		.set({ avatarKey: key })
		.where(and(eq(contacts.userId, access.mailbox.userId), eq(contacts.email, email)));
	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	const email = normalizeEmailAddress(url.searchParams.get("address") ?? "");
	if (!mailboxId || !email) return NextResponse.json({ error: "Mailbox and contact are required" }, { status: 400 });

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, mailboxId);
	if (!access?.canManage) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	const account = await getPersonalIdentityForAddress(db, access.mailbox.userId, email);
	if (account) {
		if (account.userId !== user.id) {
			return NextResponse.json({ error: "Only the account owner can change this contact" }, { status: 403 });
		}
		if (account.avatarKey) await env.BUCKET.delete(account.avatarKey);
		await syncPersonalIdentity(db, { ...account, avatarKey: null });
		return NextResponse.json({ ok: true });
	}
	const [contact] = await db
		.select({ avatarKey: contacts.avatarKey })
		.from(contacts)
		.where(and(eq(contacts.userId, access.mailbox.userId), eq(contacts.email, email)))
		.limit(1);
	if (contact?.avatarKey) await env.BUCKET.delete(contact.avatarKey);
	await db
		.update(contacts)
		.set({ avatarKey: null })
		.where(and(eq(contacts.userId, access.mailbox.userId), eq(contacts.email, email)));
	return NextResponse.json({ ok: true });
}
