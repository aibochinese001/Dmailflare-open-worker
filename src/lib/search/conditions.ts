import { and, eq, exists, gte, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { messageAttachments, messages } from "@/db/schema";
import { buildFtsMatch, parseSearchQuery } from "./query-utils";

/**
 * Translate a search string into WHERE conditions on `messages`. Text goes to
 * the FTS5 index by rowid; everything else is a plain column predicate, so the
 * caller ANDs these with its own scope (mailbox access, folder, status).
 */
export function buildSearchConditions(raw: string): SQL[] {
	const parsed = parseSearchQuery(raw);
	const conditions: SQL[] = [];

	const match = buildFtsMatch(parsed);
	if (match) {
		conditions.push(sql`${messages}.rowid IN (SELECT rowid FROM messages_fts WHERE messages_fts MATCH ${match})`);
	}
	if (parsed.hasAttachment) {
		conditions.push(
			exists(
				sql`(SELECT 1 FROM ${messageAttachments} WHERE ${messageAttachments.messageId} = ${messages.id} AND ${messageAttachments.disposition} = 'attachment')`,
			),
		);
	}
	if (parsed.read === "read") conditions.push(eq(messages.read, true));
	if (parsed.read === "unread") conditions.push(eq(messages.read, false));
	if (parsed.starred) conditions.push(eq(messages.starred, true));
	if (parsed.after) conditions.push(gte(messages.createdAt, parsed.after));
	if (parsed.before) conditions.push(lt(messages.createdAt, parsed.before));

	return conditions.length ? [and(...conditions)!] : [];
}
