import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messages, spamFeedback } from "@/db/schema";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { SessionUser } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/mailboxes/audit";
import { buildFingerprint, prepareSpamContent, tokenizeMessage } from "./tokenizer";
import { getReputationKeys } from "./analyzers/reputation";
import type { ReputationKey, SpamClassification } from "./types";
import { TOKENIZER_VERSION } from "./weights";

export async function applySpamFeedback(env: CloudflareEnv, user: SessionUser, messageId: string, classification: SpamClassification): Promise<boolean> {
	const db = getDb(env);
	const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
	if (!message?.mailboxId || message.direction !== "inbound") return false;
	const access = await getMailboxAccessLevel(db, user, message.mailboxId);
	if (!access?.canManage) return false;
	const [previous] = await db.select().from(spamFeedback).where(eq(spamFeedback.messageId, messageId)).limit(1);
	const status = classification === "spam" ? "spam" : "received";
	if (previous?.classification === classification) {
		await db.update(messages).set({ status, folderId: null }).where(eq(messages.id, messageId));
		return true;
	}

	const parsed = {
		subject: message.subject, text: message.textBody, html: message.htmlBody,
		messageId: message.providerMessageId, fromAddr: message.fromAddr, toAddr: message.toAddr,
		ccAddr: message.ccAddr, inReplyTo: message.inReplyTo,
		references: message.references?.split(/\s+/).filter(Boolean) ?? [], date: message.createdAt,
		attachments: [],
	};
	const prepared = prepareSpamContent(parsed);
	const tokens = previous ? JSON.parse(previous.trainingTokens) as string[] : tokenizeMessage(parsed, prepared);
	const keys = previous ? JSON.parse(previous.reputationKeys) as ReputationKey[] : getReputationKeys(parsed, buildFingerprint(parsed, prepared));
	const now = Math.floor(Date.now() / 1000);
	const statements: D1PreparedStatement[] = [];
	const addCounts = (target: SpamClassification, amount: 1 | -1) => {
		for (const token of tokens) statements.push(env.DB.prepare(`INSERT INTO spam_token_stats (mailbox_id, token, spam_count, ham_count, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(mailbox_id, token) DO UPDATE SET spam_count = MAX(0, spam_count + excluded.spam_count), ham_count = MAX(0, ham_count + excluded.ham_count), updated_at = excluded.updated_at`).bind(message.mailboxId, token, target === "spam" ? amount : 0, target === "ham" ? amount : 0, now));
		for (const item of keys) statements.push(env.DB.prepare(`INSERT INTO spam_reputation (mailbox_id, type, key, messages_seen, spam_count, ham_count, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(mailbox_id, type, key) DO UPDATE SET messages_seen = MAX(messages_seen, excluded.messages_seen), spam_count = MAX(0, spam_count + excluded.spam_count), ham_count = MAX(0, ham_count + excluded.ham_count), last_seen_at = excluded.last_seen_at`).bind(message.mailboxId, item.type, item.key, amount > 0 ? 1 : 0, target === "spam" ? amount : 0, target === "ham" ? amount : 0, now, now));
	};
	if (previous) addCounts(previous.classification, -1);
	addCounts(classification, 1);
	statements.push(env.DB.prepare(`INSERT INTO spam_feedback (message_id, mailbox_id, actor_user_id, classification, training_tokens, reputation_keys, tokenizer_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(message_id) DO UPDATE SET actor_user_id = excluded.actor_user_id, classification = excluded.classification, updated_at = excluded.updated_at`).bind(messageId, message.mailboxId, user.id, classification, JSON.stringify(tokens), JSON.stringify(keys), TOKENIZER_VERSION, now, now));
	statements.push(env.DB.prepare("UPDATE messages SET status = ?, folder_id = NULL WHERE id = ?").bind(status, messageId));
	await env.DB.batch(statements);
	await createAuditLog(env, {
		actorUserId: user.id,
		mailboxId: message.mailboxId,
		messageId,
		action: "email.spam_feedback",
		metadata: { classification },
	});
	return true;
}
