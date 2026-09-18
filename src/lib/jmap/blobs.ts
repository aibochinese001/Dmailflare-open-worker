import { and, eq } from "drizzle-orm";
import { messageAttachments, messages } from "@/db/schema";
import { newId } from "@/lib/ids";
import { LIMITS } from "./constants";
import { decodeBlobId, uploadBlobId } from "./ids";
import { listAccessibleMailboxIdSet } from "./access";
import type { JmapContext } from "./types";

const UPLOAD_PREFIX = "jmap-uploads";

/** Client uploads live in R2 under the user until a draft claims them. */
export async function storeUpload(ctx: JmapContext, body: ArrayBuffer, type: string, name: string | null) {
	if (body.byteLength > LIMITS.maxSizeUpload) return null;
	const id = newId("upl");
	await ctx.env.BUCKET.put(`${UPLOAD_PREFIX}/${ctx.auth.userId}/${id}`, body, {
		httpMetadata: { contentType: type },
		customMetadata: { userId: ctx.auth.userId, ...(name ? { name } : {}) },
	});
	return { accountId: ctx.accountId, blobId: uploadBlobId(id), type, size: body.byteLength };
}

export async function readUpload(ctx: JmapContext, uploadId: string) {
	const object = await ctx.env.BUCKET.get(`${UPLOAD_PREFIX}/${ctx.auth.userId}/${uploadId}`);
	if (!object) return null;
	return { content: await object.arrayBuffer(), type: object.httpMetadata?.contentType ?? "application/octet-stream", name: object.customMetadata?.name ?? null };
}

/**
 * Resolve a blob id to bytes the account may read: an attachment on one of
 * its messages, the raw MIME of one of its messages, or its own upload.
 */
export async function readBlob(ctx: JmapContext, blobId: string): Promise<{ body: ReadableStream | ArrayBuffer; type: string; name: string | null; size: number } | null> {
	const decoded = decodeBlobId(blobId);
	if (!decoded) return null;
	const accessible = await listAccessibleMailboxIdSet(ctx);

	if (decoded.kind === "up") {
		const upload = await readUpload(ctx, decoded.id);
		return upload ? { body: upload.content, type: upload.type, name: upload.name, size: upload.content.byteLength } : null;
	}
	if (decoded.kind === "att") {
		const [row] = await ctx.db
			.select({ r2Key: messageAttachments.r2Key, filename: messageAttachments.filename, type: messageAttachments.contentType, size: messageAttachments.size, mailboxId: messages.mailboxId })
			.from(messageAttachments)
			.innerJoin(messages, eq(messageAttachments.messageId, messages.id))
			.where(eq(messageAttachments.id, decoded.id))
			.limit(1);
		if (!row || !row.mailboxId || !accessible.has(row.mailboxId)) return null;
		const object = await ctx.env.BUCKET.get(row.r2Key);
		return object ? { body: object.body, type: row.type, name: row.filename, size: row.size } : null;
	}
	const [row] = await ctx.db.select().from(messages).where(and(eq(messages.id, decoded.id))).limit(1);
	if (!row || !row.mailboxId || !accessible.has(row.mailboxId)) return null;
	if (row.rawR2Key) {
		const object = await ctx.env.BUCKET.get(row.rawR2Key);
		if (object) return { body: object.body, type: "message/rfc822", name: `${row.id}.eml`, size: object.size };
	}
	// Outbound and imported mail keeps no raw copy; rebuild a minimal RFC 5322 message.
	const lines = [
		`From: ${row.fromAddr}`,
		`To: ${row.toAddr}`,
		...(row.ccAddr ? [`Cc: ${row.ccAddr}`] : []),
		`Subject: ${row.subject ?? ""}`,
		`Date: ${row.createdAt.toUTCString()}`,
		...(row.providerMessageId ? [`Message-ID: ${row.providerMessageId}`] : []),
		...(row.inReplyTo ? [`In-Reply-To: <${row.inReplyTo}>`] : []),
		"MIME-Version: 1.0",
		`Content-Type: ${row.htmlBody ? "text/html" : "text/plain"}; charset=utf-8`,
		"",
		row.htmlBody ?? row.textBody ?? "",
	];
	const bytes = new TextEncoder().encode(lines.join("\r\n"));
	return { body: bytes.buffer as ArrayBuffer, type: "message/rfc822", name: `${row.id}.eml`, size: bytes.byteLength };
}
