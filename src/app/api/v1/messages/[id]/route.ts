import { NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { getDb } from "@/db";
import { messages, users } from "@/db/schema";
import { getMailboxAccessLevel, listAccessibleMailboxIds } from "@/lib/mailboxes/access";

/**
 * Get one full message (including text and HTML bodies) by id.
 * Public API counterpart for API consumers (e.g. MailSorta's extraction
 * pipeline) that list summaries first and fetch full content per message.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
	const env = getEnv();
	const auth = await authenticateApiKey(env, request.headers.get("authorization"));
	if (!auth || !requireScope(auth.scopes, "read")) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const db = getDb(env);
	const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
	if (!user || user.disabled) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
	if (!message) {
		return NextResponse.json({ error: "Message not found" }, { status: 404 });
	}

	// Enforce the same mailbox-level read access as the list endpoint.
	if (message.mailboxId) {
		const access = await getMailboxAccessLevel(db, user, message.mailboxId);
		if (!access?.canRead) {
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}
	} else if (message.userId !== auth.userId) {
		return NextResponse.json({ error: "Message not found" }, { status: 404 });
	}

	return NextResponse.json({ message });
}
