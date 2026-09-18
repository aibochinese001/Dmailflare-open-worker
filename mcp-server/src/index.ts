/**
 * Mailflare MCP Server
 *
 * A standalone Cloudflare Worker that exposes the Mailflare HTTP API as MCP
 * tools (Model Context Protocol) so AI agents can read and send email.
 *
 * Transport: Streamable HTTP (single /mcp endpoint, JSON-RPC over HTTP POST).
 * Auth: the client passes a Mailflare API key (ep_...) via the Authorization
 * header, or the `key` query parameter. The key is forwarded to the Mailflare
 * deployment for validation on every tool call, so no credentials are stored.
 *
 * Upstream access: uses a Service Binding to the main `mailflare-opc` Worker.
 * Direct fetch() between same-account workers.dev subdomains is intercepted
 * by the edge and returns 404, so a binding is required in production.
 */

export interface Env {
	MAILFLARE_BASE_URL: string;
	/** Service binding to the Mailflare app Worker (same account). */
	MAILFLARE?: Fetcher;
}

const PROTOCOL_VERSION = "2025-03-26";
const MCP_PATH = "/mcp";

// ---------------------------------------------------------------------------
// Mailflare API client
// ---------------------------------------------------------------------------

async function mailflareFetch(
	env: Env,
	apiKey: string,
	path: string,
	init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
	const url = `${env.MAILFLARE_BASE_URL}${path}`;
	const request = new Request(url, {
		...init,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});
	// Prefer the service binding; fall back to public fetch (local dev).
	const response = env.MAILFLARE ? await env.MAILFLARE.fetch(request) : await fetch(request);
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		data = { error: `HTTP ${response.status}` };
	}
	return { ok: response.ok, status: response.status, data };
}

function apiError(data: unknown, status?: number): string {
	if (status === 401) return "Unauthorized: the Mailflare API key is invalid or lacks the required scope.";
	if (data && typeof data === "object" && "error" in data) {
		const error = (data as Record<string, unknown>).error;
		if (typeof error === "string") return error;
		return JSON.stringify(error);
	}
	return "Unknown Mailflare API error";
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

interface ToolCallResult {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

function textResult(text: string): ToolCallResult {
	return { content: [{ type: "text", text }] };
}

function errorResult(message: string): ToolCallResult {
	return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

const listMailboxesTool = {
	name: "list_mailboxes",
	description:
		"List the mailboxes available to the authenticated user, with id, address and role. Use this first to get a mailboxId for sending.",
	inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
};

async function callListMailboxes(env: Env, apiKey: string): Promise<ToolCallResult> {
	const { ok, status, data } = await mailflareFetch(env, apiKey, "/api/v1/mailboxes");
	if (!ok) return errorResult(apiError(data, status));
	const mailboxes = (data as { mailboxes?: Array<Record<string, unknown>> }).mailboxes ?? [];
	const lines = mailboxes.map(
		(m) =>
			`- id: ${m.id}\n  address: ${m.address ?? "(no address)"}\n  name: ${m.name ?? ""}\n  type: ${m.type ?? "personal"}`,
	);
	return textResult(lines.length ? lines.join("\n") : "No mailboxes found.");
}

const sendMailTool = {
	name: "send_mail",
	description:
		"Send an email from a Mailflare mailbox. Supports cc/bcc, HTML or plain text, threading headers (inReplyTo), and optional scheduled sending.",
	inputSchema: {
		type: "object" as const,
		required: ["from", "to", "subject", "mailboxId"],
		properties: {
			from: { type: "string", description: "Sender address, e.g. support@example.com" },
			to: {
				type: "array",
				items: { type: "string" },
				description: 'Recipient addresses, optionally with display names: "Maya <maya@example.com>"',
			},
			cc: { type: "array", items: { type: "string" }, description: "Carbon copy recipients" },
			bcc: { type: "array", items: { type: "string" }, description: "Blind carbon copy recipients" },
			subject: { type: "string", description: "Email subject" },
			text: { type: "string", description: "Plain text body" },
			html: { type: "string", description: "HTML body (preferred if both given)" },
			mailboxId: { type: "string", description: "Mailbox id to send from (see list_mailboxes)" },
			inReplyTo: { type: "string", description: "Message-ID of the parent email, for threading replies" },
			scheduledAt: {
				type: "string",
				description: "ISO 8601 timestamp to schedule the send instead of sending now",
			},
		},
		additionalProperties: false,
	},
};

async function callSendMail(
	env: Env,
	apiKey: string,
	args: Record<string, unknown>,
): Promise<ToolCallResult> {
	const { ok, status, data } = await mailflareFetch(env, apiKey, "/api/v1/send", {
		method: "POST",
		body: JSON.stringify(args),
	});
	if (!ok) return errorResult(apiError(data, status));
	return textResult(`Email sent.\n${JSON.stringify(data, null, 2)}`);
}

const listMessagesTool = {
	name: "list_messages",
	description:
		"List recent emails. Filter by mailbox, direction (inbound/outbound) or a search query. Supports full-text search syntax: from:, to:, subject:, is:unread, is:starred, has:attachment, after:/before: dates, quoted phrases, -exclusions.",
	inputSchema: {
		type: "object" as const,
		properties: {
			mailboxId: { type: "string", description: "Restrict to one mailbox (optional)" },
			direction: { type: "string", enum: ["inbound", "outbound"], description: "Filter direction (optional)" },
			query: {
				type: "string",
				description: "Search query, e.g. 'from:client is:unread has:attachment after:2026-09-01' (optional)",
			},
			limit: { type: "number", description: "Max results, 1-100 (default 20)" },
		},
		additionalProperties: false,
	},
};

function formatMessage(m: Record<string, unknown>): string {
	const parts = [
		`id: ${m.id}`,
		`from: ${m.fromAddress ?? m.from ?? ""}`,
		`to: ${m.toAddress ?? m.to ?? ""}`,
		`subject: ${m.subject ?? "(no subject)"}`,
		`direction: ${m.direction ?? ""}`,
		`read: ${m.read ?? "?"}`,
		`received: ${m.createdAt ?? ""}`,
	];
	const preview = typeof m.preview === "string" ? m.preview : "";
	if (preview) parts.push(`preview: ${preview.slice(0, 200)}`);
	return parts.join("\n");
}

async function callListMessages(
	env: Env,
	apiKey: string,
	args: Record<string, unknown>,
): Promise<ToolCallResult> {
	const params = new URLSearchParams();
	if (typeof args.mailboxId === "string") params.set("mailboxId", args.mailboxId);
	if (typeof args.direction === "string") params.set("direction", args.direction);
	if (typeof args.query === "string") params.set("q", args.query);
	const limit = typeof args.limit === "number" && args.limit > 0 ? Math.min(args.limit, 100) : 20;
	params.set("limit", String(limit));

	const { ok, status, data } = await mailflareFetch(env, apiKey, `/api/v1/messages?${params}`);
	if (!ok) return errorResult(apiError(data, status));
	const messages = (data as { messages?: Array<Record<string, unknown>> }).messages ?? [];
	return textResult(
		messages.length
			? `${messages.length} message(s):\n\n${messages.map(formatMessage).join("\n\n---\n\n")}`
			: "No messages found.",
	);
}

const getUnreadSummaryTool = {
	name: "get_unread_summary",
	description:
		"Quick overview: counts and the most recent unread emails across all accessible mailboxes. Ideal first call when the agent wants to check the inbox.",
	inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
};

async function callGetUnreadSummary(env: Env, apiKey: string): Promise<ToolCallResult> {
	const params = new URLSearchParams({ q: "is:unread", limit: "10" });
	const { ok, status, data } = await mailflareFetch(env, apiKey, `/api/v1/messages?${params}`);
	if (!ok) return errorResult(apiError(data, status));
	const messages = (data as { messages?: Array<Record<string, unknown>> }).messages ?? [];
	if (!messages.length) return textResult("No unread messages.");
	return textResult(
		`${messages.length} recent unread message(s):\n\n${messages.map(formatMessage).join("\n\n---\n\n")}`,
	);
}

const TOOLS = [listMailboxesTool, sendMailTool, listMessagesTool, getUnreadSummaryTool];

const TOOL_HANDLERS: Record<
	string,
	(env: Env, apiKey: string, args: Record<string, unknown>) => Promise<ToolCallResult>
> = {
	list_mailboxes: callListMailboxes,
	send_mail: callSendMail,
	list_messages: callListMessages,
	get_unread_summary: callGetUnreadSummary,
};

// ---------------------------------------------------------------------------
// JSON-RPC / MCP protocol
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

function resolveApiKey(request: Request): string | null {
	const auth = request.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) return auth.slice(7);
	const url = new URL(request.url);
	return url.searchParams.get("key");
}

function handleRpc(env: Env, apiKey: string, message: Record<string, unknown>): Response | Promise<Response> {
	const method = message.method as string | undefined;
	const id = message.id;
	const params = (message.params ?? {}) as Record<string, unknown>;

	switch (method) {
		case "initialize":
			return jsonResponse({
				jsonrpc: "2.0",
				id,
				result: {
					protocolVersion: PROTOCOL_VERSION,
					capabilities: { tools: {} },
					serverInfo: { name: "mailflare-mcp", version: "1.0.0" },
				},
			});

		case "notifications/initialized":
		case "initialized":
			// Notification, no response body needed.
			return new Response(null, { status: 202 });

		case "ping":
			return jsonResponse({ jsonrpc: "2.0", id, result: {} });

		case "tools/list":
			return jsonResponse({
				jsonrpc: "2.0",
				id,
				result: { tools: TOOLS },
			});

		case "tools/call": {
			const name = params.name as string;
			const args = (params.arguments ?? {}) as Record<string, unknown>;
			const handler = TOOL_HANDLERS[name];
			if (!handler) {
				return jsonResponse({
					jsonrpc: "2.0",
					id,
					error: { code: -32602, message: `Unknown tool: ${name}` },
				});
			}
			return handler(env, apiKey, args)
				.then((result) =>
					jsonResponse({
						jsonrpc: "2.0",
						id,
						result: {
							content: result.content,
							isError: result.isError ?? false,
						},
					}),
				)
				.catch((err) =>
					jsonResponse({
						jsonrpc: "2.0",
						id,
						result: {
							content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
							isError: true,
						},
					}),
				);
		}

		default:
			if (id === undefined || id === null) return new Response(null, { status: 202 });
			return jsonResponse({
				jsonrpc: "2.0",
				id,
				error: { code: -32601, message: `Method not found: ${method}` },
			});
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// CORS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
					"Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
					"Access-Control-Expose-Headers": "Mcp-Session-Id",
				},
			});
		}

		// Simple health check
		if (url.pathname === "/health") {
			return jsonResponse({
				ok: true,
				server: "mailflare-mcp",
				upstream: env.MAILFLARE_BASE_URL,
				serviceBinding: !!env.MAILFLARE,
			});
		}

		if (url.pathname !== MCP_PATH) {
			return new Response("Not Found", { status: 404 });
		}

		if (request.method !== "POST") {
			return new Response("Method Not Allowed. Use POST for MCP Streamable HTTP.", { status: 405 });
		}

		const apiKey = resolveApiKey(request);
		if (!apiKey) {
			return new Response(
				JSON.stringify({
					jsonrpc: "2.0",
					error: {
						code: -32001,
						message:
							"Unauthorized: pass your Mailflare API key (ep_...) as 'Authorization: Bearer <key>' or '?key=<key>'",
					},
				}),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			);
		}

		let body: Record<string, unknown>;
		try {
			body = (await request.json()) as Record<string, unknown>;
		} catch {
			return jsonResponse({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
		}

		// Batch requests (JSON-RPC 2.0 spec)
		if (Array.isArray(body)) {
			const results = await Promise.all(
				(body as Array<Record<string, unknown>>).map((msg) =>
					handleRpc(env, apiKey, msg) as Promise<Response>,
				),
			);
			const payloads = await Promise.all(results.map((r) => (r.status === 202 ? null : r.json())));
			return jsonResponse(payloads.filter(Boolean));
		}

		return handleRpc(env, apiKey, body) as Response | Promise<Response>;
	},
};
