export async function confirmPasswordReset(token: string, password: string): Promise<{ ok: boolean; error?: string }> {
	const res = await fetch("/api/auth/password-reset/confirm", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		signal: AbortSignal.timeout(20_000),
		body: JSON.stringify({ token, password }),
	});
	const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
	return { ok: res.ok, error: typeof data.error === "string" ? data.error : undefined };
}
