import { getEmailAddress } from "@/lib/email/address";
import type { ParsedEmail } from "@/lib/email/parse";
import { getDomain } from "../tokenizer";

export function getReputationKeys(message: ParsedEmail, fingerprint: string) {
	const email = getEmailAddress(message.fromAddr ?? "").toLowerCase();
	const domain = getDomain(email);
	return [
		...(email ? [{ type: "email" as const, key: email }] : []),
		...(domain ? [{ type: "domain" as const, key: domain }] : []),
		{ type: "fingerprint" as const, key: fingerprint },
	];
}
