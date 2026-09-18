export async function requestPasswordReset(form: FormData): Promise<{ ok: boolean; error?: string }> {
	const res = await fetch("/api/auth/password-reset/request", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		signal: AbortSignal.timeout(20_000),
		body: JSON.stringify({ email: form.get("email"), turnstileToken: form.get("turnstileToken") }),
	});
	const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
	return { ok: res.ok, error: typeof data.error === "string" ? data.error : undefined };
}
