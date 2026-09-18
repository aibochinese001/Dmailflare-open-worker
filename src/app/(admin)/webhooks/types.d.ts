export type WebhookEvent = "message.inbound" | "message.outbound" | "message.failed";

export type WebhookDeliveryStats = {
	total: number;
	delivered: number;
	failing: number;
	pending: number;
	lastAttemptAt: number | null;
};

export type Webhook = {
	id: string;
	url: string;
	description: string | null;
	events: WebhookEvent[];
	enabled: boolean;
	maxAttempts: number;
	createdAt: string | number;
	stats: WebhookDeliveryStats;
};

export type WebhookDelivery = {
	id: string;
	eventType: string;
	status: "pending" | "delivered" | "failed" | "retrying" | "exhausted";
	attempts: number;
	maxAttempts: number;
	responseStatus: number | null;
	error: string | null;
	durationMs: number | null;
	lastAttemptAt: string | number | null;
	nextRetryAt: string | number | null;
	createdAt: string | number;
	payload: string;
};

export type CreateWebhookInput = {
	url: string;
	description?: string;
	events: WebhookEvent[];
	maxAttempts: number;
};

export type UpdateWebhookInput = {
	url?: string;
	description?: string | null;
	events?: WebhookEvent[];
	enabled?: boolean;
	maxAttempts?: number;
};
