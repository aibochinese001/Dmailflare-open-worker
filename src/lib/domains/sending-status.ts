import type { CfSendingSubdomain } from "@/lib/cloudflare-api.types";

export function findSendingSubdomain(
	hostname: string,
	subdomains: CfSendingSubdomain[],
): CfSendingSubdomain | null {
	const normalizedHostname = hostname.toLowerCase();
	const exact = subdomains.find(
		(subdomain) => subdomain.name.toLowerCase() === normalizedHostname,
	);
	if (exact) return exact;

	return subdomains.find((subdomain) => {
		const normalizedName = subdomain.name.toLowerCase();
		if (!normalizedName.startsWith("*.")) return false;

		const baseDomain = normalizedName.slice(2);
		return normalizedHostname !== baseDomain && normalizedHostname.endsWith(`.${baseDomain}`);
	}) ?? null;
}
