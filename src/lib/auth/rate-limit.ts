export async function allowLoginAttempt(env: CloudflareEnv, request: Request): Promise<boolean> {
	if (!env.LOGIN_RATE_LIMIT) return true;
	const ip = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
	try {
		const outcome = await env.LOGIN_RATE_LIMIT.limit({ key: ip });
		return outcome.success;
	} catch (error) {
		console.warn("Login rate limiter unavailable", error);
		return true;
	}
}
