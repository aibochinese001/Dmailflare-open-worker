import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { recordAuthActivity } from "@/lib/auth/activity";
import { createLoginChallenge } from "@/lib/auth/login-challenge";

export async function POST(request: Request) {
	const env = getEnv();
	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "Invalid login request" }, { status });
	}
	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json(
			{ error: "Too many login attempts. Try again shortly." },
			{ status: 429, headers: { "Retry-After": "60" } },
		);
	}
	if (!(await verifyTurnstileToken(env, request, (body as Record<string, unknown>).turnstileToken))) {
		return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
	}

	const db = getDb(env);
	const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
	if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
		return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
	}
	if (user.disabled) {
		return NextResponse.json({ error: "Account disabled" }, { status: 403 });
	}

	// The password is right but a second factor is on: hand back a short-lived
	// challenge instead of a session and let /api/auth/mfa/verify finish.
	if (user.totpEnabled && user.totpSecret) {
		const challengeToken = await createLoginChallenge(env, user.id);
		const pending = NextResponse.json({ ok: true, mfaRequired: true, challengeToken });
		pending.headers.set("Cache-Control", "no-store");
		return pending;
	}

	const token = await createSession(env, user.id);
	await recordAuthActivity(env, { action: "auth.login", userId: user.id, request });
	const response = NextResponse.json({
		ok: true,
		token,
		redirect: "/inbox",
	});
	response.headers.set("Cache-Control", "no-store");
	response.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
	});
	return response;
}
