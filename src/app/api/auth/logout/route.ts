import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/cloudflare";
import { deleteSession, getUserFromSession, SESSION_COOKIE } from "@/lib/auth/session";
import { recordAuthActivity } from "@/lib/auth/activity";

export async function POST(request: Request) {
	const env = getEnv();
	const jar = await cookies();
	const authorization = request.headers.get("Authorization");
	const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
	const token = bearerToken || jar.get(SESSION_COOKIE)?.value;
	if (token) {
		const user = await getUserFromSession(env, token);
		if (user) await recordAuthActivity(env, { action: "auth.logout", userId: user.id, request });
		await deleteSession(env, token);
	}

	const response = NextResponse.json({ ok: true });
	response.cookies.set(SESSION_COOKIE, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
	return response;
}
