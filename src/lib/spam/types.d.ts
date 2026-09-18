import type { ParsedEmail } from "@/lib/email/parse";

export type SpamVerdict = "inbox" | "suspicious" | "spam";
export type SpamClassification = "spam" | "ham";

export type SpamSignal = {
	id: string;
	score: number;
	reason: string;
	metadata?: Record<string, unknown>;
};

export type SpamAnalysisInput = {
	mailboxId: string;
	userId: string;
	envelopeFrom: string;
	headers?: Record<string, string>;
	message: ParsedEmail;
	intelligenceProvider?: SpamIntelligenceProvider;
};

export type SpamAnalysisResult = {
	score: number;
	verdict: SpamVerdict;
	signals: SpamSignal[];
	contentProbability?: number;
	fingerprint: string;
};

export type ReputationKey = { type: "email" | "domain" | "fingerprint"; key: string };

export type PreparedSpamContent = {
	visibleText: string;
	urlDomains: string[];
};

export interface SpamIntelligenceProvider {
	check(input: { senderDomain: string; urlDomains: string[]; fingerprint: string }): Promise<SpamSignal[]>;
}

export type BayesianResult = {
	probability: number;
	contribution: number;
	trainedMessages: number;
	strongestTokens: Array<{ token: string; probability: number }>;
};
