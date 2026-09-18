import { and, eq, lt, or, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { apiKeys, users } from "@/db/schema";
import { parseScopes, verifyApiKey } from "@/lib/api-keys";
import type { ApiAuthResult } from "@/lib/api/key-auth-types";

const LAST_USED_WRITE_INTERVAL_MS = 60_000;

/**
 * Resolve an API key to its user and scopes. Framework-free so it can run in
 * `worker.ts` as well as route handlers. `lastUsedAt` is refreshed at most
 * once a minute per key, since protocol clients make many small calls.
 */
export async function authenticateApiKeyValue(env: CloudflareEnv, key: string): Promise<ApiAuthResult | null> {
	const trimmed = key.trim();
	if (!trimmed) return null;
	const prefix = trimmed.slice(0, 12);
	const db = getDb(env);
	const candidates = await db.select().from(apiKeys).where(eq(apiKeys.prefix, prefix));

	for (const candidate of candidates) {
		if (!verifyApiKey(trimmed, candidate.keyHash)) continue;
		const [user] = await db.select().from(users).where(eq(users.id, candidate.userId)).limit(1);
		if (!user || user.disabled) continue;

		const stale = new Date(Date.now() - LAST_USED_WRITE_INTERVAL_MS);
		await db
			.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(and(eq(apiKeys.id, candidate.id), or(isNull(apiKeys.lastUsedAt), lt(apiKeys.lastUsedAt, stale))));

		return { userId: user.id, email: user.email, scopes: parseScopes(candidate.scopes), user };
	}
	return null;
}

/**
 * JMAP clients send the key either as a Bearer token or as the password of
 * HTTP Basic auth (the username is ignored; the key identifies the account).
 */
export async function authenticateApiRequest(env: CloudflareEnv, request: Request): Promise<ApiAuthResult | null> {
	const authorization = request.headers.get("Authorization") ?? "";
	if (authorization.startsWith("Bearer ")) return authenticateApiKeyValue(env, authorization.slice(7));
	if (authorization.startsWith("Basic ")) {
		let decoded = "";
		try {
			decoded = atob(authorization.slice(6).trim());
		} catch {
			return null;
		}
		const separator = decoded.indexOf(":");
		return authenticateApiKeyValue(env, separator >= 0 ? decoded.slice(separator + 1) : decoded);
	}
	return null;
}

export function hasScope(scopes: string[], required: string): boolean {
	return scopes.includes(required) || scopes.includes("*");
}
