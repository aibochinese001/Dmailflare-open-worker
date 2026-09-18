import { authFetch, clearClientSessionToken } from "@/lib/auth/client";

export async function logoutClientSession(): Promise<void> {
	try {
		await authFetch("/api/auth/logout", {
			method: "POST",
			redirectOnUnauthorized: false,
		});
	} catch {
		// Local logout must complete even when the server request is unavailable.
	} finally {
		clearClientSessionToken();
	}
}
