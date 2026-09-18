import { and, eq, ne } from "drizzle-orm";
import type { getDb } from "@/db";
import { mailboxes, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

type Db = ReturnType<typeof getDb>;

export async function selectAccountById(db: Db, id: string) {
	const [account] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return account ?? null;
}

export async function emailBelongsToAnotherAccount(db: Db, accountId: string, email: string) {
	const [account] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.email, email), ne(users.id, accountId)))
		.limit(1);
	return !!account;
}

export async function updateAccountCredentials(
	db: Db,
	id: string,
	input: { email?: string; name: string; password: string | null; disabled?: boolean },
) {
	await db
		.update(users)
		.set({
			...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
			name: input.name,
			...(typeof input.disabled === "boolean" ? { disabled: input.disabled } : {}),
			...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
		})
		.where(eq(users.id, id));

	await db
		.update(mailboxes)
		.set({ displayName: input.name })
		.where(and(eq(mailboxes.userId, id), eq(mailboxes.type, "personal")));
}
