import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { deleteMessageAttachment } from "@/lib/email/attachments";
import { userOwnsDraft } from "../../../utils";

type DraftAttachmentRouteParams = {
	params: Promise<{ id: string; attachmentId: string }>;
};

/** Drop one file from a draft, e.g. an attachment carried over by Forward the user does not want to send. */
export async function DELETE(request: Request, { params }: DraftAttachmentRouteParams) {
	const { id, attachmentId } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const [draft] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

	if (!userOwnsDraft(draft, user.id)) {
		return NextResponse.json({ error: "Draft not found" }, { status: 404 });
	}

	const removed = await deleteMessageAttachment(env, id, attachmentId);
	if (!removed) {
		return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
	}
	return NextResponse.json({ ok: true });
}
