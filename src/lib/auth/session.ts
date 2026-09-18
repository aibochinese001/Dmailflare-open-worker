import { and, eq, gt, ne } from "drizzle-orm";
import { newId } from "@/lib/ids";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "ep_session";
const SESSION_DAYS = 30;

export function generateSessionToken(): string {
	return newId("sess");
}

export async function hashSessionToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export async function createSession(env: CloudflareEnv, userId: string): Promise<string> {
	const db = getDb(env);
	const token = generateSessionToken();
	const tokenHash = await hashSessionToken(token);
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

	await db.insert(sessions).values({
		id: newId(),
		userId,
		tokenHash,
		expiresAt,
	});

	return token;
}

export async function getUserFromSession(
	env: CloudflareEnv,
	token: string | undefined,
): Promise<typeof users.$inferSelect | null> {
	if (!token) return null;
	const db = getDb(env);
	const tokenHash = await hashSessionToken(token);
	const [session] = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
		.limit(1);
	if (!session) return null;
	const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
	return user ?? null;
}

export async function deleteSession(env: CloudflareEnv, token: string): Promise<void> {
	const db = getDb(env);
	const tokenHash = await hashSessionToken(token);
	await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

/**
 * Sign the user out everywhere, optionally keeping the session that made the
 * request. Used after a password change or reset and when MFA is switched on.
 */
export async function deleteUserSessions(env: CloudflareEnv, userId: string, keepToken?: string): Promise<void> {
	const db = getDb(env);
	if (keepToken) {
		const keepHash = await hashSessionToken(keepToken);
		await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, keepHash)));
		return;
	}
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** The session token a request carries, from the Bearer header or the cookie. */
export function getSessionTokenFromRequestHeaders(request: Request): string | undefined {
	const authorization = request.headers.get("Authorization");
	if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim() || undefined;
	const cookie = request.headers.get("Cookie") ?? "";
	const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
	return match ? decodeURIComponent(match[1]) : undefined;
}
