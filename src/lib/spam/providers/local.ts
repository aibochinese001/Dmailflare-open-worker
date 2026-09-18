import type { SpamIntelligenceProvider, SpamSignal } from "../types";

export class LocalSpamIntelligenceProvider implements SpamIntelligenceProvider {
	check(): Promise<SpamSignal[]> {
		return Promise.resolve([]);
	}
}
