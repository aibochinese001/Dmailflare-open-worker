import { findZoneByHostname } from "@/lib/cloudflare-api";
import type { DomainPreflightResult } from "@/lib/domains/types";

export async function preflightDomain(
	env: CloudflareEnv,
	hostname: string,
): Promise<DomainPreflightResult> {
	const normalized = hostname.toLowerCase().trim();
	const zone = await findZoneByHostname(env, normalized);
	if (!zone) {
		throw new Error(
			`Zone not found for "${normalized}". The domain must use Cloudflare DNS on this account.`,
		);
	}

	return { hostname: normalized, zone };
}
