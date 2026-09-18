import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { loginChallenges } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashSessionToken } from "@/lib/auth/session";

const CHALLENGE_MINUTES = 5;

/** Issued once the password is right; the second factor completes it. */
export async function createLoginChallenge(env: CloudflareEnv, userId: string): Promise<string> {
	const db = getDb(env);
	const token = newId("mfa");
	const expiresAt = new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000);
	await db.insert(loginChallenges).values({ id: newId(), userId, tokenHash: await hashSessionToken(token), expiresAt });
	return token;
}

/** Look a challenge up without consuming it, so a wrong code can be retried within the window. */
export async function getLoginChallengeUserId(env: CloudflareEnv, token: string): Promise<string | null> {
	const db = getDb(env);
	const [row] = await db
		.select({ userId: loginChallenges.userId })
		.from(loginChallenges)
		.where(and(eq(loginChallenges.tokenHash, await hashSessionToken(token)), gt(loginChallenges.expiresAt, new Date())))
		.limit(1);
	return row?.userId ?? null;
}

export async function consumeLoginChallenge(env: CloudflareEnv, token: string): Promise<void> {
	const db = getDb(env);
	await db.delete(loginChallenges).where(eq(loginChallenges.tokenHash, await hashSessionToken(token)));
}
