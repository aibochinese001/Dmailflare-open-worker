import type { SpamSignal } from "@/lib/spam/types";

export function parseSpamSignals(value: string | null | undefined): SpamSignal[] {
	if (!value) return [];
	try {
		const result = JSON.parse(value) as unknown;
		return Array.isArray(result)
			? result.filter((item): item is SpamSignal => !!item && typeof item === "object" && typeof item.id === "string" && typeof item.score === "number" && typeof item.reason === "string")
			: [];
	} catch {
		return [];
	}
}
