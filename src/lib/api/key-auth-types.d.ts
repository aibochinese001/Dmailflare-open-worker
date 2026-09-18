import type { users } from "@/db/schema";

export type ApiAuthResult = {
	userId: string;
	email: string;
	scopes: string[];
	user: typeof users.$inferSelect;
};
