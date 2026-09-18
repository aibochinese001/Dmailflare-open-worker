import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { AuditLogInput } from "./types";

export async function createAuditLog(env: CloudflareEnv, input: AuditLogInput): Promise<void> {
	const db = getDb(env);
	await db.insert(auditLogs).values({
		id: newId("aud"),
		actorUserId: input.actorUserId ?? null,
		targetUserId: input.targetUserId ?? null,
		mailboxId: input.mailboxId ?? null,
		messageId: input.messageId ?? null,
		action: input.action,
		metadata: input.metadata ? JSON.stringify(input.metadata) : null,
	});
}
