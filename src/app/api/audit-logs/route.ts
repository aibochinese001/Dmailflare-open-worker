import { desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, domains, mailboxes, users } from "@/db/schema";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";

export async function GET(request: Request) {
	const env = getEnv();
	const admin = await requireUser(env, request);
	try {
		assertAdmin(admin);
	} catch {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const url = new URL(request.url);
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);
	const db = getDb(env);
	const targetUsers = alias(users, "target_users");
	const rows = await db
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			metadata: auditLogs.metadata,
			createdAt: auditLogs.createdAt,
			actorEmail: users.email,
			targetEmail: targetUsers.email,
			mailboxLocalPart: mailboxes.localPart,
			mailboxHostname: domains.hostname,
		})
		.from(auditLogs)
		.leftJoin(users, eq(users.id, auditLogs.actorUserId))
		.leftJoin(targetUsers, eq(targetUsers.id, auditLogs.targetUserId))
		.leftJoin(mailboxes, eq(mailboxes.id, auditLogs.mailboxId))
		.leftJoin(domains, eq(domains.id, mailboxes.domainId))
		.where(inArray(auditLogs.action, ["auth.login", "auth.logout"]))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);

	return NextResponse.json({ auditLogs: rows });
}
