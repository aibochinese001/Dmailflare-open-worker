import { NextResponse } from "next/server";
import { eq, desc, and, gt, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { getDb } from "@/db";
import { messages, users } from "@/db/schema";
import { getMailboxAccessLevel, listAccessibleMailboxIds } from "@/lib/mailboxes/access";
import { buildSearchConditions } from "@/lib/search/conditions";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await authenticateApiKey(env, request.headers.get("authorization"));
	if (!auth || !requireScope(auth.scopes, "read")) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	const direction = url.searchParams.get("direction");
	const query = url.searchParams.get("q")?.trim();
	const sinceMs = Number(url.searchParams.get("since"));
	// Server-side incremental cursor: only messages received strictly after
	// this epoch-milliseconds timestamp (used by API consumers like MailSorta).
	const since = Number.isFinite(sinceMs) && sinceMs > 0 ? new Date(sinceMs) : null;
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

	const db = getDb(env);
	const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
	if (!user || user.disabled) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const conditions: SQL[] = [];
	if (mailboxId) {
		const access = await getMailboxAccessLevel(db, user, mailboxId);
		if (!access?.canRead) {
			return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
		}
		conditions.push(eq(messages.mailboxId, mailboxId));
	} else {
		const accessibleMailboxIds = await listAccessibleMailboxIds(db, user);
		if (accessibleMailboxIds.length > 0) {
			conditions.push(inArray(messages.mailboxId, accessibleMailboxIds));
		} else {
			conditions.push(eq(messages.userId, auth.userId));
		}
	}
	if (direction === "inbound" || direction === "outbound") {
		conditions.push(eq(messages.direction, direction));
	}
	if (since) conditions.push(gt(messages.createdAt, since));
	if (query) conditions.push(...buildSearchConditions(query));

	const rows = await db
		.select()
		.from(messages)
		.where(and(...conditions))
		.orderBy(desc(messages.createdAt))
		.limit(limit);

	return NextResponse.json({ messages: rows });
}
