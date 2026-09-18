import type { ReputationKey } from "./types";

export async function recordReputationObservation(env: CloudflareEnv, mailboxId: string, keys: ReputationKey[]): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	await env.DB.batch(keys.map((item) => env.DB.prepare(
		`INSERT INTO spam_reputation (mailbox_id, type, key, messages_seen, spam_count, ham_count, first_seen_at, last_seen_at) VALUES (?, ?, ?, 1, 0, 0, ?, ?) ON CONFLICT(mailbox_id, type, key) DO UPDATE SET messages_seen = messages_seen + 1, last_seen_at = excluded.last_seen_at`,
	).bind(mailboxId, item.type, item.key, now, now)));
}
