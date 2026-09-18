import { Building2, Sparkles } from "lucide-react";
import type { LicensePlan } from "./types";
import { authFetch } from "@/lib/auth/client";
import { LICENSE_STATUS_CHANGED_EVENT } from "@/lib/licenses/constants";
import type { ActivatableLicensePlan, LicenseAction, LicenseResponse } from "./types";

export const LICENSE_PLANS: LicensePlan[] = [
	{
		name: "Pro",
		price: 19,
		originalPrice: 39,
		description: "A perpetual license for one account, including one year of product updates.",
		features: ["Custom branding", "All future Pro features", "One year of updates", "Keep the licensed version forever"],
		icon: Sparkles,
		checkoutUrl: "https://app.paymug.co/buy/mailflare-pro",
	},
	{
		name: "Team",
		price: 249,
		description: "A perpetual multi-account license with every Pro capability and one year of updates.",
		features: ["Everything in Pro", "Add and manage other accounts", "Shared mailbox access as available", "One year of updates", "Keep the licensed version forever"],
		icon: Building2,
		checkoutUrl: "https://app.paymug.co/buy/mailflare-team",
	},
];

export async function loadLicenseStatus(): Promise<NonNullable<LicenseResponse["license"]>> {
	const response = await authFetch("/api/licenses");
	const data = (await response.json()) as LicenseResponse;
	if (!response.ok || !data.license) throw new Error(data.error ?? "Unable to load license status");
	return data.license;
}

export async function runLicenseAction(
	action: LicenseAction,
	licenseKey: string,
	plan?: ActivatableLicensePlan,
): Promise<NonNullable<LicenseResponse["license"]>> {
	const response = await authFetch(`/api/licenses/${action}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ licenseKey, ...(plan ? { plan } : {}) }),
	});
	const data = (await response.json()) as LicenseResponse;
	if (!response.ok || !data.license) throw new Error(data.error ?? "License request failed");
	window.dispatchEvent(new Event(LICENSE_STATUS_CHANGED_EVENT));
	return data.license;
}

export function formatLicensePlan(plan: string): string {
	return plan === "team" ? "Team" : plan === "pro" ? "Pro" : "Community";
}

export function formatLicenseDate(value: Date | string | null): string | null {
	if (!value) return null;
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
