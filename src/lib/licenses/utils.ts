import type { LicensePlan, LicenseState, PaymugLicenseResponse } from "./types";
import { LICENSE_PRODUCT_IDS } from "./constants";

export async function hashLicenseKey(licenseKey: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(licenseKey));
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export function parseFeatures(value: string): string[] {
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter((feature): feature is string => typeof feature === "string") : [];
	} catch {
		return [];
	}
}

export function parsePaymugLicenseResponse(value: unknown): PaymugLicenseResponse {
	if (!value || typeof value !== "object") throw new Error("Paymug returned an invalid license response");
	const response = value as Record<string, unknown>;
	const states: LicenseState[] = ["active", "invalid", "expired", "deactivated"];

	if (typeof response.valid !== "boolean" || !states.includes(response.state as LicenseState)) {
		throw new Error("Paymug returned an invalid license response");
	}

	return {
		valid: response.valid,
		state: response.state as PaymugLicenseResponse["state"],
		instanceId: typeof response.instanceId === "string" ? response.instanceId : undefined,
		productId: typeof response.productId === "string" ? response.productId : undefined,
		plan: typeof response.plan === "string" ? response.plan : undefined,
		features: Array.isArray(response.features)
			? response.features.filter((feature): feature is string => typeof feature === "string")
			: undefined,
	};
}

export function normalizeLicensePlan(productId: string | undefined, plan: string | undefined): LicensePlan | null {
	if (productId) {
		if (productId === LICENSE_PRODUCT_IDS.pro) return "pro";
		if (productId === LICENSE_PRODUCT_IDS.team) return "team";
		return null;
	}

	const normalized = plan?.trim().toLowerCase();
	return normalized === "pro" || normalized === "team" ? normalized : null;
}
