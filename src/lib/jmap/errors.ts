import type { JmapMethodError } from "./types";

export class JmapError extends Error {
	constructor(
		public readonly type: string,
		description?: string,
		public readonly extra: Record<string, unknown> = {},
	) {
		super(description ?? type);
	}

	toMethodError(): JmapMethodError {
		return { type: this.type, ...(this.message !== this.type ? { description: this.message } : {}), ...this.extra };
	}
}

export function invalidArguments(description: string): JmapError {
	return new JmapError("invalidArguments", description);
}

/** RFC 7807 problem document for request-level failures. */
export function problemResponse(type: string, status: number, detail: string, extra: Record<string, unknown> = {}): Response {
	return new Response(JSON.stringify({ type: `urn:ietf:params:jmap:error:${type}`, status, detail, ...extra }), {
		status,
		headers: { "Content-Type": "application/problem+json", ...corsHeaders() },
	});
}

export function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Authorization, Content-Type",
		"Access-Control-Max-Age": "86400",
	};
}
