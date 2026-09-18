import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { passwordResetConfirmSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { completePasswordReset } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
	const env = getEnv();
	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "Invalid request" }, { status });
	}
	const parsed = passwordResetConfirmSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Choose a password of at least 8 characters" }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": "60" } });
	}

	const result = await completePasswordReset(env, parsed.data.token, parsed.data.password, request);
	if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
	return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
