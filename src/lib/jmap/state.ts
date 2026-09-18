import { count, inArray, max, sql, sum } from "drizzle-orm";
import { folders, messages } from "@/db/schema";
import type { JmapContext } from "./types";
import { listAccessibleMailboxIdSet } from "./access";

/**
 * Opaque state strings. Messages have no updated_at, so the Email state is a
 * digest of what a client would notice changing: row count, newest row, and
 * the flag and status tallies. Changes cannot be replayed from it, so
 * /changes answers cannotCalculateChanges and clients re-query.
 */
export async function getEmailState(ctx: JmapContext): Promise<string> {
	const ids = Array.from(await listAccessibleMailboxIdSet(ctx));
	if (ids.length === 0) return "0";
	const [row] = await ctx.db
		.select({
			total: count(),
			newest: max(sql<number>`${messages}.rowid`),
			read: sum(sql`case when ${messages.read} then 1 else 0 end`),
			starred: sum(sql`case when ${messages.starred} then 1 else 0 end`),
			status: sum(sql`length(${messages.status})`),
			folder: sum(sql`case when ${messages.folderId} is null then 0 else 1 end`),
		})
		.from(messages)
		.where(inArray(messages.mailboxId, ids));
	return [row?.total ?? 0, row?.newest ?? 0, row?.read ?? 0, row?.starred ?? 0, row?.status ?? 0, row?.folder ?? 0].join(".");
}

export async function getMailboxState(ctx: JmapContext): Promise<string> {
	const ids = Array.from(await listAccessibleMailboxIdSet(ctx));
	if (ids.length === 0) return "0";
	const [row] = await ctx.db
		.select({ total: count(), newest: max(sql<number>`${folders}.rowid`), names: sum(sql`length(${folders.name})`) })
		.from(folders)
		.where(inArray(folders.mailboxId, ids));
	// Counts live on Mailbox objects, so the mailbox state moves with the email state too.
	return `${ids.length}.${row?.total ?? 0}.${row?.newest ?? 0}.${row?.names ?? 0}.${await getEmailState(ctx)}`;
}
