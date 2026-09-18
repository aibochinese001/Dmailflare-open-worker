import type { SpamScoreDetailsProps } from "./spam-score-details-types";
import { parseSpamSignals } from "./spam-score-details-utils";

export function SpamScoreDetails({ score, verdict, signals, analysisError }: SpamScoreDetailsProps) {
	if (score == null && !analysisError) return null;
	const parsedSignals = parseSpamSignals(signals);
	return (
		<details className="mx-6 mb-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
			<summary className="cursor-pointer text-sm font-medium text-neutral-800">
				{score == null ? "Spam analysis unavailable" : `Spam score: ${score} · ${verdict ?? "inbox"}`}
			</summary>
			{analysisError ? (
				<p className="mt-2 text-sm text-neutral-600">The filter could not analyze this message. It was delivered normally.</p>
			) : parsedSignals.length > 0 ? (
				<div className="mt-3 space-y-1.5 text-sm text-neutral-600">
					<p className="font-medium text-neutral-800">Why Mailflare gave this score</p>
					{parsedSignals.map((signal) => (
						<p key={signal.id}><span className={signal.score > 0 ? "text-red-600" : "text-green-700"}>{signal.score > 0 ? "+" : ""}{signal.score}</span>{" "}{signal.reason}</p>
					))}
				</div>
			) : (
				<p className="mt-2 text-sm text-neutral-600">No significant spam signals were found.</p>
			)}
		</details>
	);
}
