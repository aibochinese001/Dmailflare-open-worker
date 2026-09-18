import type { NewMessageEvent } from "./message-realtime-types";

export const REALTIME_FALLBACK_INTERVAL_MS = 60_000;
export const REALTIME_HEARTBEAT_INTERVAL_MS = 25_000;
export const REALTIME_RECONNECT_MAX_MS = 30_000;

export function getRealtimeWebSocketUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/api/realtime`;
}

export function getReconnectDelay(attempt: number): number {
	return Math.min(1_000 * 2 ** attempt, REALTIME_RECONNECT_MAX_MS);
}

export function parseNewMessageEvent(value: string): NewMessageEvent | null {
	try {
		const payload = JSON.parse(value) as Partial<NewMessageEvent>;
		if (
			payload.type !== "new_message" ||
			typeof payload.messageId !== "string" ||
			typeof payload.mailboxId !== "string" ||
			typeof payload.from !== "string"
		) {
			return null;
		}

		return {
			type: "new_message",
			messageId: payload.messageId,
			mailboxId: payload.mailboxId,
			from: payload.from,
			fromName: typeof payload.fromName === "string" ? payload.fromName : null,
			subject: typeof payload.subject === "string" ? payload.subject : null,
		};
	} catch {
		return null;
	}
}

export function showBrowserNewMessageNotification(event: NewMessageEvent): void {
	if (
		typeof Notification === "undefined" ||
		Notification.permission !== "granted" ||
		document.visibilityState === "visible"
	) {
		return;
	}

	const notification = new Notification(event.subject || "New email", {
		body: `From ${event.fromName ?? event.from}`,
		icon: "/icons/icon.svg",
		tag: event.messageId,
	});
	notification.onclick = () => {
		window.focus();
		window.location.assign(`/inbox/${event.messageId}`);
		notification.close();
	};
}
