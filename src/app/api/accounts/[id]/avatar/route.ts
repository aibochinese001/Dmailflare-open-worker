import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import {
	ALLOWED_AVATAR_TYPES,
	MAX_AVATAR_SIZE,
	avatarKeyFor,
	isUploadedAvatarFile,
} from "@/app/api/profile/avatar/utils";
import type { AccountRouteParams } from "../types";
import { getManagedAccount } from "./utils";

export async function GET(request: Request, { params }: AccountRouteParams) {
	const { id } = await params;
	const { access, account } = await getManagedAccount(request, id);
	if (access.error) return access.error;
	if (!account?.avatarKey) return new Response("Not found", { status: 404 });
	const object = await access.env.BUCKET.get(account.avatarKey);
	if (!object) return new Response("Not found", { status: 404 });
	return new Response(object.body, {
		headers: {
			"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
			"Cache-Control": "private, no-cache",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

export async function POST(request: Request, { params }: AccountRouteParams) {
	const { id } = await params;
	const { access, account } = await getManagedAccount(request, id);
	if (access.error) return access.error;
	if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
	const form = await request.formData();
	const file = form.get("file");
	if (!isUploadedAvatarFile(file)) return NextResponse.json({ error: "Missing image file" }, { status: 400 });
	if (!ALLOWED_AVATAR_TYPES.includes(file.type)) return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image" }, { status: 400 });
	if (file.size > MAX_AVATAR_SIZE) return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 413 });
	const key = avatarKeyFor(account.id);
	await access.env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
	await getDb(access.env).update(users).set({ avatarKey: key }).where(eq(users.id, account.id));
	return NextResponse.json({ ok: true });
}
