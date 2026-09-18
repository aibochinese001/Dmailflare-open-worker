import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { readJsonBody } from "@/lib/http/request";
import { verifyPassword } from "@/lib/auth/password";
import { issueRecoveryCodes } from "@/lib/auth/recovery-codes";
import { mfaEnrollSchema } from "@/lib/validators";

/** Replace the recovery codes; the old ones stop working immediately. */
export async function POST(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	const parsed = mfaEnrollSchema.safeParse(await readJsonBody(request, 16 * 1024).catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: "Enter your password" }, { status: 400 });
	if (!verifyPassword(parsed.data.password, auth.user.passwordHash)) {
		return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
	}
	if (!auth.user.totpEnabled) {
		return NextResponse.json({ error: "Two-factor authentication is off" }, { status: 400 });
	}
	return NextResponse.json({ recoveryCodes: await issueRecoveryCodes(env, auth.user.id) }, { headers: { "Cache-Control": "no-store" } });
}
