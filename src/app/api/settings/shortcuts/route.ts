import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import type { UpdateShortcutsSettingsInput } from "./types";
import { parseUpdateShortcutsSettingsRequest } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;

	return NextResponse.json({ enabled: auth.user.keyboardShortcutsEnabled });
}

export async function PATCH(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;

	let input: UpdateShortcutsSettingsInput;
	try {
		input = await parseUpdateShortcutsSettingsRequest(request);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.flatten() }, { status: 400 });
		}
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	await getDb(env)
		.update(users)
		.set({ keyboardShortcutsEnabled: input.enabled })
		.where(eq(users.id, auth.user.id));

	return NextResponse.json({ enabled: input.enabled });
}
