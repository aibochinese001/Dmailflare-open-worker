import { and, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { mailboxes } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export async function getSharedMailboxForAdmin(db: Db, mailboxId: string, adminUserId: string) {
	const [mailbox] = await db
		.select({ id: mailboxes.id })
		.from(mailboxes)
		.where(and(eq(mailboxes.id, mailboxId), eq(mailboxes.userId, adminUserId), eq(mailboxes.type, "shared")))
		.limit(1);
	return mailbox ?? null;
}
