import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import { authFetch } from "@/lib/auth/client";
import { getEmailAddress, normalizeEmailAddress, splitEmailAddressList } from "@/lib/email/address";
import { getLatestEmailContent } from "@/lib/email/reply-content-utils";
import dayjs from "dayjs";
import { sanitizeEmailHtml } from "@/app/(dashboard)/inbox/[messageId]/email-html-sanitizer";
import { escapeHtml, htmlToPlainText, textToHtml, wrapQuotedHtml } from "@/components/compose/rich-text-utils";
import type {
  BlockMessageContactInput,
  ForwardDraftInput,
  MoveMessageActionItem,
  ReplyableMessage,
  ReplyDraftInput,
  ReplyMode,
  ReplyRecipients,
  TrashSenderRuleInput,
} from "./types";
import {
  ArchiveIcon,
  Inbox,
  InboxIcon,
  ShieldAlertIcon,
  ShieldIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";

export function getMessageBackHref(
  direction: "inbound" | "outbound",
  status: string,
) {
  if (status === "trash") return "/trash";
  if (status === "spam") return "/spam";
  if (status === "archived") return "/archived";
  if (status === "draft") return "/drafts";
  return direction === "inbound" ? "/inbox" : "/sent";
}

export async function runSingleMessageAction(
  messageId: string,
  action: BulkMessageAction,
) {
  const response = await authFetch("/api/messages/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageIds: [messageId], action }),
  });

  if (!response.ok) {
    throw new Error("Unable to update message");
  }

  window.dispatchEvent(new Event("mailflare:messages-changed"));
}

export function openUnsubscribeUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function confirmTrashWithoutUnsubscribe() {
  return window.confirm(
    "This email does not provide an unsubscribe link. It will be moved to Trash, and future emails from this sender will also be moved to Trash.",
  );
}

export async function createTrashSenderRule({
  mailboxId,
  senderAddress,
}: TrashSenderRuleInput) {
  const sender = getEmailAddress(senderAddress).trim().toLowerCase();
  if (!sender) throw new Error("Sender address is required");

  const response = await authFetch("/api/routing-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      matchField: "email",
      matchOperator: "exact",
      matchValue: sender,
      destination: "trash",
      priority: 0,
    }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Unable to create trash rule");
}

export async function blockMessageContact({
  mailboxId,
  senderAddress,
}: BlockMessageContactInput) {
  const response = await authFetch("/api/contacts/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mailboxId, address: senderAddress }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Unable to block contact");
}

export function getMoveMessageActions(
  status: string,
  direction: "inbound" | "outbound",
): MoveMessageActionItem[] {
  const actions: MoveMessageActionItem[] = [];
  if ((status === "archived" || status === "spam") && direction === "inbound") {
    actions.push({ action: "inbox", label: status === "spam" ? "Not spam" : "Inbox", icon: InboxIcon });
  }
  if (status !== "archived")
    actions.push({ action: "archive", label: "Archived", icon: ArchiveIcon });
  if (status !== "spam")
    actions.push({ action: "spam", label: "Spam", icon: ShieldAlertIcon });
  if (status !== "trash")
    actions.push({ action: "trash", label: "Trash", icon: Trash2Icon });
  return actions;
}

export function getMessageActionRedirect(
  action: BulkMessageAction,
  direction: "inbound" | "outbound",
) {
  if (action === "trash") return "/trash";
  if (action === "spam") return "/spam";
  if (action === "archive") return "/archived";
  if (action === "inbox") return "/inbox";
  return null;
}

export function buildReplySubject(subject: string | null | undefined) {
  const trimmed = (subject ?? "").trim();
  if (!trimmed) return "Re:";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function buildReplyQuote(
  senderAddress: string,
  bodyText: string | null | undefined,
) {
  const latest = getLatestEmailContent(bodyText).trim();
  if (!latest) return "";
  const quoted = latest
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\n${getEmailAddress(senderAddress)} wrote:\n${quoted}\n`;
}

const QUOTE_STYLE = "margin:0 0 0 .8ex;border-left:1px solid #ccc;padding-left:1ex";

/**
 * The folded quote under a reply: the "On <date>, <sender> wrote:" line every
 * client recognises, then the original as HTML (sanitised) or as text.
 */
export function buildReplyQuoteHtml(
  senderAddress: string,
  sentAt: string | null | undefined,
  bodyText: string | null | undefined,
  bodyHtml: string | null | undefined,
) {
  const original = bodyHtml ? sanitizeEmailHtml(bodyHtml) : textToHtml(bodyText);
  if (!original) return null;
  const when = sentAt ? dayjs(sentAt).format("ddd, MMM D, YYYY [at] h:mm A") : "an earlier date";
  return wrapQuotedHtml(
    `<div>On ${escapeHtml(when)}, ${escapeHtml(senderAddress)} wrote:</div><blockquote style="${QUOTE_STYLE}">${original}</blockquote>`,
  );
}

/**
 * Who a reply goes to. A plain reply answers the sender; reply-all also keeps
 * everyone else on the To and Cc lines, minus the mailbox's own addresses so
 * the author is not mailing themselves. Replying to a sent message re-addresses
 * its original recipients.
 */
export function getReplyRecipients(
  message: ReplyableMessage,
  ownAddresses: string[],
  mode: ReplyMode,
): ReplyRecipients {
  const own = new Set(ownAddresses.map((address) => normalizeEmailAddress(address)));
  const seen = new Set<string>();
  const unique = (entries: string[]) =>
    entries.filter((entry) => {
      const key = normalizeEmailAddress(entry);
      if (!key || own.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (message.direction === "outbound") {
    const to = unique(splitEmailAddressList(message.toAddr));
    const cc = mode === "replyAll" ? unique(splitEmailAddressList(message.ccAddr)) : [];
    return { to, cc };
  }

  const to = unique([message.fromAddr]);
  if (mode !== "replyAll") return { to, cc: [] };
  const cc = unique([...splitEmailAddressList(message.toAddr), ...splitEmailAddressList(message.ccAddr)]);
  return { to, cc };
}

/** Reply-all is only worth offering when it would reach someone a plain reply would not. */
export function hasAdditionalRecipients(message: ReplyableMessage, ownAddresses: string[]): boolean {
  const all = getReplyRecipients(message, ownAddresses, "replyAll");
  const single = getReplyRecipients(message, ownAddresses, "reply");
  return all.to.length + all.cc.length > single.to.length + single.cc.length;
}

/** The threading headers a reply must carry so both sides file it in the same conversation. */
export function getReplyThreading(message: ReplyableMessage) {
  const parentId = (message.providerMessageId ?? "").trim().replace(/^<|>$/g, "") || null;
  const chain = (message.references ?? "")
    .split(/\s+/)
    .map((id) => id.replace(/^<|>$/g, ""))
    .filter(Boolean);
  if (parentId && !chain.includes(parentId)) chain.push(parentId);
  return {
    inReplyTo: parentId,
    references: chain.length ? chain.join(" ") : null,
    threadId: message.threadId ?? parentId,
  };
}

export function buildForwardSubject(subject: string | null | undefined) {
  const trimmed = (subject ?? "").trim();
  if (!trimmed) return "Fwd:";
  return /^fwd?:/i.test(trimmed) ? trimmed : `Fwd: ${trimmed}`;
}

/** The header block mail clients put above a forwarded message, as folded HTML. */
export function buildForwardHtml(
  message: ForwardDraftInput["message"],
  bodyText: string | null | undefined,
  bodyHtml: string | null | undefined,
) {
  const lines = [
    `From: ${message.fromAddr}`,
    `Date: ${dayjs(message.createdAt).format("ddd, MMM D, YYYY [at] h:mm A")}`,
    `Subject: ${message.subject ?? "(no subject)"}`,
    `To: ${message.toAddr}`,
  ];
  if (message.ccAddr) lines.push(`Cc: ${message.ccAddr}`);
  const header = `<div>---------- Forwarded message ---------<br>${lines.map(escapeHtml).join("<br>")}</div><br>`;
  const original = bodyHtml ? sanitizeEmailHtml(bodyHtml) : textToHtml(bodyText);
  return wrapQuotedHtml(`${header}${original ?? ""}`);
}

/**
 * A forward keeps the original's attachments (copied onto the draft server-side)
 * and references its Message-ID so recipients who already have it see the link.
 */
export async function createForwardDraft({ mailboxId, ownAddress, message, bodyText, bodyHtml }: ForwardDraftInput) {
  const html = buildForwardHtml(message, bodyText, bodyHtml);
  const response = await authFetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      from: getEmailAddress(ownAddress ?? ""),
      to: "",
      subject: buildForwardSubject(message.subject),
      html,
      text: htmlToPlainText(html),
      references: getReplyThreading(message).references,
      threadId: message.threadId,
      forwardOfMessageId: message.id,
    }),
  });
  const data = (await response.json()) as { draft?: { id: string }; error?: string };
  if (!response.ok || !data.draft) throw new Error(data.error ?? "Unable to start forward");
  return data.draft.id;
}

export async function createReplyDraft({
  mailboxId,
  senderAddress,
  ownAddress,
  subject,
  bodyText,
  bodyHtml,
  sentAt,
  recipients,
  threading,
}: ReplyDraftInput) {
  if (recipients.to.length === 0) throw new Error("Sender address is required");
  const html = buildReplyQuoteHtml(senderAddress, sentAt, bodyText, bodyHtml) ?? "";

  const response = await authFetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      // The API rejects the draft unless `from` matches the mailbox address.
      from: getEmailAddress(ownAddress ?? ""),
      to: recipients.to.join(", "),
      cc: recipients.cc.join(", "),
      subject: buildReplySubject(subject),
      html,
      text: htmlToPlainText(html),
      ...threading,
    }),
  });
  const data = (await response.json()) as {
    draft?: { id: string };
    error?: string;
  };
  if (!response.ok || !data.draft)
    throw new Error(data.error ?? "Unable to create reply draft");
  return data.draft.id;
}
