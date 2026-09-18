import type { SpamSignal } from "../types";
import { SPAM_WEIGHTS } from "../weights";
import { findHeader } from "./utils";

export function analyzeAuthentication(headers?: Record<string, string>): SpamSignal[] {
	const value = findHeader(headers, "authentication-results");
	if (!value) return [];
	const authservId = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
	if (!/(^|\.)cloudflare\.(com|net)$/.test(authservId)) return [];
	const signals: SpamSignal[] = [];
	for (const method of ["dmarc", "dkim", "spf"] as const) {
		const result = value.match(new RegExp(`(?:^|[;\\s])${method}=([a-z]+)`, "i"))?.[1]?.toLowerCase();
		if (result === "pass") signals.push({ id: `${method}_passed`, score: SPAM_WEIGHTS.authentication[`${method}Pass`], reason: `${method.toUpperCase()} authentication passed` });
		if (result === "fail") signals.push({ id: `${method}_failed`, score: SPAM_WEIGHTS.authentication[`${method}Fail`], reason: `${method.toUpperCase()} authentication failed` });
	}
	return signals;
}
