import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { apiKeys } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";

/** Revoke (delete) one of the current user's API keys. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const { id } = await context.params;

	const db = getDb(env);
	const deleted = await db
		.delete(apiKeys)
		.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
		.returning({ id: apiKeys.id });

	if (deleted.length === 0) {
		return NextResponse.json({ error: "API key not found" }, { status: 404 });
	}
	return NextResponse.json({ ok: true });
}
