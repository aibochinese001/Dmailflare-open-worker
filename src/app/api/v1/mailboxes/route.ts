import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { listAccessibleMailboxes } from "@/lib/mailboxes/access";

/**
 * List mailboxes accessible to the API key's user.
 * Public API counterpart of GET /api/mailboxes (which uses session auth),
 * so API consumers (and the MCP server) can resolve a mailboxId before sending.
 */
export async function GET(request: Request) {
	const env = getEnv();
	const auth = await authenticateApiKey(env, request.headers.get("authorization"));
	if (!auth || !requireScope(auth.scopes, "read")) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const db = getDb(env);
	const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
	if (!user || user.disabled) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const mailboxes = await listAccessibleMailboxes(db, user);
	return NextResponse.json({
		mailboxes: mailboxes.map((mailbox) => ({
			id: mailbox.id,
			name: mailbox.displayName,
			address: `${mailbox.localPart}@${mailbox.hostname}`,
			type: mailbox.type,
			permission: mailbox.permission,
		})),
	});
}
