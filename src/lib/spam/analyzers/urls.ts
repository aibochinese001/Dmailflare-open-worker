import type { ParsedEmail } from "@/lib/email/parse";
import type { PreparedSpamContent, SpamSignal } from "../types";

export function analyzeUrls(message: ParsedEmail, prepared: PreparedSpamContent): SpamSignal[] {
	const domains = prepared.urlDomains;
	const signals: SpamSignal[] = [];
	if (domains.some((domain) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain))) signals.push({ id: "ip_address_url", score: 8, reason: "A link uses an IP address instead of a domain" });
	if (domains.some((domain) => domain.includes("xn--"))) signals.push({ id: "punycode_url", score: 5, reason: "A link uses an internationalized domain encoding" });
	if (domains.length > 10) signals.push({ id: "many_link_domains", score: Math.min(8, domains.length - 8), reason: "Message links to an unusually large number of domains", metadata: { count: domains.length } });
	for (const match of (message.html ?? "").slice(0, 250_000).matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/a>/gi)) {
		try {
			const target = new URL(match[1]).hostname.toLowerCase().replace(/^www\./, "");
			const displayed = new URL(match[2]).hostname.toLowerCase().replace(/^www\./, "");
			if (target !== displayed) {
				signals.push({ id: "displayed_link_mismatch", score: 10, reason: "A link's displayed address differs from its destination" });
				break;
			}
		} catch {}
	}
	return signals;
}
