import { and, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { getContactId } from "@/lib/contacts/utils";

type Db = ReturnType<typeof getDb>;

export async function getContactByEmail(db: Db, userId: string, email: string) {
	const [contact] = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.userId, userId), eq(contacts.email, email)))
		.limit(1);
	return contact ?? null;
}

export function toContactDetails(contact: Awaited<ReturnType<typeof getContactByEmail>>) {
	if (!contact) return null;
	const { avatarKey, ...details } = contact;
	return { ...details, hasAvatar: !!avatarKey };
}

export async function saveManualContactName(
	db: Db,
	input: { userId: string; email: string; displayName: string },
) {
	const existing = await getContactByEmail(db, input.userId, input.email);
	if (existing) {
		await db
			.update(contacts)
			.set({ displayName: input.displayName, source: "manual" })
			.where(eq(contacts.id, existing.id));
		return { ...existing, displayName: input.displayName, source: "manual" as const };
	}

	const id = getContactId(input.userId, input.email);
	await db.insert(contacts).values({
		id,
		userId: input.userId,
		email: input.email,
		displayName: input.displayName,
		source: "manual",
	});
	return getContactByEmail(db, input.userId, input.email);
}
