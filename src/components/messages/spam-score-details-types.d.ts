import type { SpamSignal } from "@/lib/spam/types";

export type SpamScoreDetailsProps = {
	score?: number | null;
	verdict?: "inbox" | "suspicious" | "spam" | null;
	signals?: string | null;
	analysisError?: string | null;
};

export type ParsedSpamDetails = { signals: SpamSignal[] };
