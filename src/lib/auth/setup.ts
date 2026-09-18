import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isMissingUsersTableError } from "@/lib/auth/setup-utils";

export async function hasAdminAccount(env: CloudflareEnv): Promise<boolean> {
	if (!env.DB) return false;

	try {
		const db = getDb(env);
		const [admin] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.role, "admin"))
			.limit(1);

		return !!admin;
	} catch (error) {
		if (isMissingUsersTableError(error)) return false;
		throw error;
	}
}
