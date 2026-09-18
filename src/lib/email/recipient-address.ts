import { parseAddress } from "@/lib/utils";
import type { ParsedRecipientAddress } from "./recipient-address-types";

export function normalizeRecipientLocalPart(localPart: string): string {
	const [baseLocalPart] = localPart.split("+", 1);
	return baseLocalPart
		.replaceAll(".", "")
		.toLowerCase();
}

export function parseRecipientAddress(address: string): ParsedRecipientAddress | null {
	const parsed = parseAddress(address);
	if (!parsed) return null;

	const localPart = normalizeRecipientLocalPart(parsed.local);
	if (!localPart) return null;

	return {
		original: address,
		localPart,
		domain: parsed.domain,
		normalizedAddress: `${localPart}@${parsed.domain}`,
	};
}
