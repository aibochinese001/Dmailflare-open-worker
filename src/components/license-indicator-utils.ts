import { authFetch } from "@/lib/auth/client";
import type { LicenseIndicatorResponse } from "./license-indicator-types";

export async function loadLicenseIndicatorStatus() {
	try {
		const response = await authFetch("/api/licenses", { redirectOnUnauthorized: false });
		if (!response.ok) return null;
		const data = (await response.json()) as LicenseIndicatorResponse;
		return data.license ?? null;
	} catch {
		return null;
	}
}
