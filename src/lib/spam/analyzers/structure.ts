import type { ParsedEmail } from "@/lib/email/parse";
import type { PreparedSpamContent, SpamSignal } from "../types";
import { getDomain } from "../tokenizer";
import { findHeader } from "./utils";

export function analyzeStructure(message: ParsedEmail, headers: Record<string, string> | undefined, prepared: PreparedSpamContent): SpamSignal[] {
	const signals: SpamSignal[] = [];
	const visible = prepared.visibleText;
	const fromDomain = getDomain(message.fromAddr);
	const replyDomain = getDomain(findHeader(headers, "reply-to"));
	const upperLetters = (visible.match(/[A-Z]/g) ?? []).length;
	const letters = (visible.match(/[A-Za-z]/g) ?? []).length;
	if (!message.subject?.trim()) signals.push({ id: "empty_subject", score: 3, reason: "Message has no subject" });
	if (message.html && !message.text?.trim() && visible.trim().length < 80) signals.push({ id: "thin_html_only", score: 6, reason: "HTML-only message has very little visible text" });
	if (/[\u200B-\u200D\u2060\uFEFF]/u.test(visible)) signals.push({ id: "zero_width_text", score: 7, reason: "Message contains hidden zero-width characters" });
	if (letters > 40 && upperLetters / letters > 0.65) signals.push({ id: "excessive_capitals", score: 4, reason: "Message uses excessive capitalization" });
	if (replyDomain && fromDomain && replyDomain !== fromDomain) signals.push({ id: "reply_to_mismatch", score: 5, reason: "Reply-To domain differs from the sender domain" });
	const credentialLure = /\b(verify|confirm|unlock|restore|validate|sign[ -]?in|log[ -]?in)\b.{0,60}\b(account|password|mailbox|identity|access)\b/i.test(visible)
		|| /\b(account|password|mailbox|identity|access)\b.{0,60}\b(verify|confirm|unlock|restore|validate|sign[ -]?in|log[ -]?in)\b/i.test(visible);
	const urgent = /\b(urgent|immediately|within 24 hours|suspended|expires? today|final warning)\b/i.test(visible);
	if (credentialLure && urgent && prepared.urlDomains.length > 0) signals.push({ id: "credential_phishing_pattern", score: 24, reason: "Message combines an urgent account request with an external link" });
	const paymentLure = /\b(gift card|wire transfer|cryptocurrency|bitcoin|wallet|bank transfer)\b/i.test(visible);
	const paymentRequest = /\b(pay|payment|send|transfer|purchase|deposit)\b/i.test(visible);
	if (paymentLure && paymentRequest && (urgent || (!!replyDomain && !!fromDomain && replyDomain !== fromDomain))) signals.push({ id: "payment_scam_pattern", score: 16, reason: "Message contains a high-risk urgent payment pattern" });
	const risky = message.attachments.filter((attachment) => /\.(exe|scr|js|vbs|bat|cmd|iso|img)$/i.test(attachment.filename));
	if (risky.length) signals.push({ id: "risky_attachment", score: 10, reason: "Message contains a potentially risky attachment", metadata: { count: risky.length } });
	return signals;
}
