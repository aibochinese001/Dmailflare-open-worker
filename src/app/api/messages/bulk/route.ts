import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { folders, messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { createAuditLog } from "@/lib/mailboxes/audit";
import { applySpamFeedback } from "@/lib/spam/feedback";
import type { BulkMessagePayload } from "./types";
import {
	getReadValueForBulkAction,
	getStatusForBulkAction,
	isAllowedBulkMessageAction,
} from "./utils";

export async function POST(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = (await request.json()) as BulkMessagePayload;
	const messageIds = payload.messageIds?.filter(Boolean) ?? [];
	if (messageIds.length === 0 || !isAllowedBulkMessageAction(payload.action)) {
		return NextResponse.json({ error: "Invalid bulk message action" }, { status: 400 });
	}

	const status = getStatusForBulkAction(payload.action);
	const read = getReadValueForBulkAction(payload.action);
	const db = getDb(env);
	let folderId: string | null | undefined;

	if (payload.action === "folder") {
		if (!payload.folderId) {
			return NextResponse.json({ error: "Folder is required" }, { status: 400 });
		}
		const [folder] = await db
			.select({ id: folders.id, mailboxId: folders.mailboxId })
			.from(folders)
			.where(eq(folders.id, payload.folderId))
			.limit(1);
		if (!folder) {
			return NextResponse.json({ error: "Folder not found" }, { status: 404 });
		}
		const folderAccess = await getMailboxAccessLevel(db, user, folder.mailboxId);
		if (!folderAccess?.canManage) {
			return NextResponse.json({ error: "Folder not found" }, { status: 404 });
		}
		folderId = folder.id;
	} else if (payload.action === "spam" || payload.action === "trash" || payload.action === "inbox" || payload.action === "archive") {
		folderId = null;
	}

	const values = {
		...(status ? { status } : {}),
		...(read !== null ? { read } : {}),
		...(folderId !== undefined ? { folderId } : {}),
	};

	if (Object.keys(values).length === 0) {
		return NextResponse.json({ error: "No changes requested" }, { status: 400 });
	}

	const selectedMessages = await db.select().from(messages).where(inArray(messages.id, messageIds));
	const allowedMessageIds: string[] = [];

	for (const message of selectedMessages) {
		if (!message.mailboxId) continue;
		const access = await getMailboxAccessLevel(db, user, message.mailboxId);
		const canUpdate = payload.action === "read" || payload.action === "unread" ? access?.canRead : access?.canManage;
		if (!canUpdate) continue;
		allowedMessageIds.push(message.id);
	}

	if (allowedMessageIds.length === 0) {
		return NextResponse.json({ error: "No accessible messages" }, { status: 404 });
	}
	if (payload.action === "spam") {
		for (const messageId of allowedMessageIds) await applySpamFeedback(env, user, messageId, "spam");
		return NextResponse.json({ ok: true });
	}
	if (payload.action === "inbox") {
		const spamMessageIds = selectedMessages.filter((message) => message.status === "spam" && allowedMessageIds.includes(message.id)).map((message) => message.id);
		const normalMessageIds = allowedMessageIds.filter((messageId) => !spamMessageIds.includes(messageId));
		for (const messageId of spamMessageIds) await applySpamFeedback(env, user, messageId, "ham");
		if (normalMessageIds.length) await db.update(messages).set(values).where(inArray(messages.id, normalMessageIds));
		return NextResponse.json({ ok: true });
	}

	await db.update(messages).set(values).where(inArray(messages.id, allowedMessageIds));
	await Promise.all(
		allowedMessageIds.map((messageId) =>
			createAuditLog(env, {
				actorUserId: user.id,
				messageId,
				action: payload.action === "read" || payload.action === "unread" ? "email.read" : "email.delete",
				metadata: { bulkAction: payload.action },
			}),
		),
	);

	return NextResponse.json({ ok: true });
}
