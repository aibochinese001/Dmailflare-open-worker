import { NextResponse } from "next/server";
import { eq, desc, and, or, count, countDistinct, isNull, isNotNull, inArray, lte, gt, max, notInArray, sql, sum } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getContactDisplayNameMap } from "@/lib/contacts/service";
import { getFirstEmailAddressEntry, normalizeEmailAddress } from "@/lib/email/address";
import { buildSnippet } from "@/lib/email/parse";
import { getMailboxAccessLevel, listAccessibleMailboxes } from "@/lib/mailboxes/access";
import { tracksAccountIdentity } from "@/lib/profile/identity-utils";
import { buildSearchConditions } from "@/lib/search/conditions";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const direction = url.searchParams.get("direction");
	const mailboxId = url.searchParams.get("mailboxId");
	const folderId = url.searchParams.get("folderId");
	const status = url.searchParams.get("status");
	const query = url.searchParams.get("q")?.trim();
	const title = url.searchParams.get("title")?.trim();
	const read = url.searchParams.get("read");
	const starred = url.searchParams.get("starred");
	const snoozed = url.searchParams.get("snoozed");
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
	const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
	// Conversation view: one row per thread, represented by its newest message
	// that matches the filter. Drafts are never grouped.
	const groupByThread = url.searchParams.get("group") === "thread" && status !== "draft";

	const db = getDb(env);
	const accessibleMailboxes = await listAccessibleMailboxes(db, user);
	const accessibleMailboxIds = accessibleMailboxes.map((mailbox) => mailbox.id);
	const conditions: SQL[] = [];
	if (mailboxId) {
		const access = await getMailboxAccessLevel(db, user, mailboxId);
		if (!access?.canRead) {
			return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
		}
		conditions.push(eq(messages.mailboxId, mailboxId));
	} else if (accessibleMailboxIds.length > 0) {
		conditions.push(inArray(messages.mailboxId, accessibleMailboxIds));
	} else {
		conditions.push(eq(messages.userId, user.id));
	}
	if (direction === "inbound" || direction === "outbound") {
		conditions.push(eq(messages.direction, direction));
	}
	if (folderId) {
		conditions.push(eq(messages.folderId, folderId));
	}
	if (status) {
		conditions.push(eq(messages.status, status));
	}
	if (status === "received" && !folderId) {
		conditions.push(isNull(messages.folderId));
		conditions.push(or(isNull(messages.snoozedUntil), lte(messages.snoozedUntil, new Date()))!);
	}
	if (starred === "true") {
		conditions.push(eq(messages.starred, true));
	}
	if (snoozed === "true") {
		conditions.push(eq(messages.status, "received"));
		conditions.push(isNull(messages.folderId));
		conditions.push(gt(messages.snoozedUntil, new Date()));
	}
	if (read === "read") {
		conditions.push(eq(messages.read, true));
	}
	if (read === "unread") {
		conditions.push(eq(messages.read, false));
	}
	if (query || title) {
		// Operators (from:, has:attachment, before:) and free text go through the
		// full-text index; `title` is the legacy subject filter and is folded in.
		conditions.push(...buildSearchConditions(title ? `${query ?? ""} subject:"${title}"` : query ?? ""));
	}
	const where = and(...conditions);
	// Messages that were never threaded (older rows, drafts) stand alone.
	const threadKey = sql<string>`coalesce(${messages.threadId}, ${messages.id})`;

	let total = 0;
	let rows: (typeof messages.$inferSelect)[];
	// Which stored messages each visible row stands for, so acting on a
	// conversation row acts on the whole conversation within this folder.
	const threadMessageIds = new Map<string, string[]>();
	if (groupByThread) {
		const [totalRow] = await db.select({ total: countDistinct(threadKey) }).from(messages).where(where);
		total = totalRow?.total ?? 0;
		const latestPerThread = db
			.select({ tid: threadKey.as("tid"), latest: max(messages.createdAt).as("latest") })
			.from(messages)
			.where(where)
			.groupBy(threadKey)
			.as("latest_per_thread");
		const joined = await db
			.select({ message: messages })
			.from(messages)
			.innerJoin(
				latestPerThread,
				and(eq(threadKey, latestPerThread.tid), eq(messages.createdAt, latestPerThread.latest)),
			)
			.where(where)
			.orderBy(desc(messages.createdAt))
			.limit(limit)
			.offset(offset);
		// Two messages in one thread can share a timestamp to the second; keep one row.
		const seen = new Set<string>();
		rows = [];
		for (const { message } of joined) {
			const key = message.threadId ?? message.id;
			if (seen.has(key)) continue;
			seen.add(key);
			rows.push(message);
		}
		const keys = rows.map((row) => row.threadId ?? row.id);
		if (keys.length > 0) {
			const members = await db
				.select({ id: messages.id, key: threadKey })
				.from(messages)
				.where(and(where, inArray(threadKey, keys)));
			for (const member of members) {
				const list = threadMessageIds.get(member.key) ?? [];
				list.push(member.id);
				threadMessageIds.set(member.key, list);
			}
		}
	} else {
		const [totalRow] = await db.select({ total: count() }).from(messages).where(where);
		total = totalRow?.total ?? 0;
		rows = await db
			.select()
			.from(messages)
			.where(where)
			.orderBy(desc(messages.createdAt))
			.limit(limit)
			.offset(offset);
	}
	// Conversation sizes for the rows on this page, so the list can show "(3)"
	// next to a subject the way threaded clients do.
	const threadIds = Array.from(new Set(rows.map((row) => row.threadId).filter((id): id is string => !!id)));
	const threadCounts = new Map<string, { total: number; unread: number }>();
	if (threadIds.length > 0) {
		const scope = mailboxId
			? eq(messages.mailboxId, mailboxId)
			: accessibleMailboxIds.length > 0
				? inArray(messages.mailboxId, accessibleMailboxIds)
				: eq(messages.userId, user.id);
		const countRows = await db
			.select({
				threadId: messages.threadId,
				total: count(),
				unread: sum(sql`case when ${messages.read} = 0 then 1 else 0 end`),
			})
			.from(messages)
			.where(and(scope, inArray(messages.threadId, threadIds), isNotNull(messages.threadId), notInArray(messages.status, ["draft", "trash"])))
			.groupBy(messages.threadId);
		for (const row of countRows) {
			if (row.threadId) threadCounts.set(row.threadId, { total: row.total, unread: Number(row.unread ?? 0) });
		}
	}
	const mailboxNameMap = new Map(
		accessibleMailboxes.map((mailbox) => [
			mailbox.id,
			mailbox.userId === user.id && tracksAccountIdentity(mailbox, user.email)
				? user.name
				: mailbox.displayName ?? mailbox.localPart,
		]),
	);
	const contactMapsByUserId = new Map(
		await Promise.all(
			Array.from(new Set(rows.map((message) => message.userId))).map(async (userId) => [
				userId,
				await getContactDisplayNameMap(
					env,
					userId,
					rows
						.filter((message) => message.userId === userId)
						.flatMap((message) => [message.fromAddr, getFirstEmailAddressEntry(message.toAddr)]),
				),
			] as const),
		),
	);
	const enrichedRows = rows.map(({ rawR2Key: _rawR2Key, ...message }) => {
		const contactMap = contactMapsByUserId.get(message.userId);
		const accountName = message.mailboxId ? mailboxNameMap.get(message.mailboxId) : null;
		return {
			...message,
			snippet: buildSnippet(message.textBody, message.htmlBody) || message.snippet,
			fromContactName:
				(message.direction === "outbound" ? accountName : null) ??
				contactMap?.get(normalizeEmailAddress(message.fromAddr)) ??
				null,
			toContactName: contactMap?.get(normalizeEmailAddress(getFirstEmailAddressEntry(message.toAddr))) ?? null,
			threadCount: (message.threadId && threadCounts.get(message.threadId)?.total) || 1,
			threadUnread: (message.threadId && threadCounts.get(message.threadId)?.unread) || 0,
			...(groupByThread
				? { threadMessageIds: threadMessageIds.get(message.threadId ?? message.id) ?? [message.id] }
				: {}),
		};
	});

	return NextResponse.json({ messages: enrichedRows, total, limit, offset, grouped: groupByThread });
}
