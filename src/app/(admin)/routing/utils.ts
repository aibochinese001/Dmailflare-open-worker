import { authFetch } from "@/lib/auth/client";
import type { AdminRoutingDomainsResponse } from "./types";

export async function fetchAdminRoutingDomains(): Promise<AdminRoutingDomainsResponse> {
	const response = await authFetch("/api/domains");
	const data = (await response.json()) as AdminRoutingDomainsResponse & { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Unable to load domains");
	return { domains: data.domains ?? [] };
}
