import { authFetch } from "@/lib/auth/client";
import type {
	CreateWebhookInput,
	UpdateWebhookInput,
	Webhook,
	WebhookDelivery,
	WebhookEvent,
} from "./types";

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; hint: string }[] = [
	{ value: "message.inbound", label: "Inbound message", hint: "A message was received and stored" },
	{ value: "message.outbound", label: "Outbound message", hint: "A message was sent" },
	{ value: "message.failed", label: "Delivery failure", hint: "An outbound message failed" },
];

export const DELIVERY_STATUS_LABELS = {
	pending: "Pending",
	delivered: "Delivered",
	failed: "Failed",
	retrying: "Retrying",
	exhausted: "Gave up",
} as const;

async function readJson<T>(res: Response): Promise<T> {
	const json = (await res.json()) as T & { error?: unknown };
	if (!res.ok) {
		throw new Error(typeof json.error === "string" ? json.error : "Request failed");
	}
	return json;
}

export async function fetchWebhooks(): Promise<Webhook[]> {
	const json = await readJson<{ webhooks: Webhook[] }>(await authFetch("/api/webhooks"));
	return json.webhooks ?? [];
}

export async function fetchDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
	const json = await readJson<{ deliveries: WebhookDelivery[] }>(
		await authFetch(`/api/webhooks/${webhookId}/deliveries?limit=50`),
	);
	return json.deliveries ?? [];
}

export async function createWebhook(input: CreateWebhookInput) {
	return readJson<{ id: string; secret: string }>(
		await authFetch("/api/webhooks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
}

export async function updateWebhook(id: string, input: UpdateWebhookInput) {
	return readJson(
		await authFetch(`/api/webhooks/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
}

export async function deleteWebhook(id: string) {
	return readJson(await authFetch(`/api/webhooks/${id}`, { method: "DELETE" }));
}

export async function testWebhook(id: string) {
	return readJson<{ deliveryId: string; status: string }>(
		await authFetch(`/api/webhooks/${id}/test`, { method: "POST" }),
	);
}

export async function retryDelivery(webhookId: string, deliveryId: string) {
	return readJson<{ status: string }>(
		await authFetch(`/api/webhooks/${webhookId}/deliveries/${deliveryId}/retry`, {
			method: "POST",
		}),
	);
}

/** Drizzle timestamps arrive as epoch seconds when they bypass the column mapper. */
export function formatTimestamp(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return "—";
	const numeric = typeof value === "number" ? value : Date.parse(String(value));
	if (!Number.isFinite(numeric)) return "—";
	const ms = numeric < 1e12 ? numeric * 1000 : numeric;
	return new Date(ms).toLocaleString();
}

export function formatDuration(ms: number | null): string {
	if (ms === null || ms === undefined) return "—";
	return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function isRetryable(delivery: WebhookDelivery): boolean {
	return delivery.status !== "delivered";
}
