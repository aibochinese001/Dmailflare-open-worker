import PostalMime from "postal-mime";
import { formatPostalAddress, formatPostalAddressList } from "@/lib/email/address";
import { normalizeMessageId, parseMessageIdList } from "@/lib/email/threading";
import { normalizeAttachmentContent } from "@/lib/email/attachments";
import { getLatestEmailContent, htmlToReadableText } from "@/lib/email/reply-content-utils";
import type { AttachmentContent } from "@/lib/email/attachment-types";

export type ParsedEmail = {
	subject: string | null;
	text: string | null;
	html: string | null;
	messageId: string | null;
	fromAddr: string | null;
	/** Full To header, comma-joined. */
	toAddr: string | null;
	/** Full Cc header, comma-joined. */
	ccAddr: string | null;
	inReplyTo: string | null;
	references: string[];
	date: Date | null;
	attachments: AttachmentContent[];
};

export async function parseRawMime(raw: ArrayBuffer): Promise<ParsedEmail> {
	const email = await PostalMime.parse(raw);
	const date = email.date ? new Date(email.date) : null;
	return {
		subject: email.subject ?? null,
		text: email.text ?? null,
		html: email.html ?? null,
		messageId: email.messageId ?? null,
		fromAddr: formatPostalAddress(email.from, null),
		toAddr: formatPostalAddressList(email.to, null),
		ccAddr: formatPostalAddressList(email.cc, null),
		inReplyTo: normalizeMessageId(email.inReplyTo),
		references: parseMessageIdList(email.references),
		date: date && !Number.isNaN(date.getTime()) ? date : null,
		attachments: email.attachments.map((attachment, index) => ({
			filename: attachment.filename ?? `attachment-${index + 1}`,
			type: attachment.mimeType || "application/octet-stream",
			content: normalizeAttachmentContent(attachment.content, attachment.encoding),
			disposition: attachment.disposition === "inline" ? "inline" : "attachment",
			contentId: attachment.contentId ?? null,
		})),
	};
}

export function buildSnippet(text: string | null, html: string | null, max = 200): string {
	const source = getLatestEmailContent(text?.trim() || htmlToReadableText(html));
	return source.replace(/\s+/g, " ").trim().slice(0, max);
}
