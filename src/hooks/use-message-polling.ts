import { useCallback, useEffect, useState } from "react";
import {
	AUTH_SESSION_CHANGED_EVENT,
	getClientSessionToken,
} from "@/lib/auth/client";
import type {
	MessageRealtimeState,
	NewMessageEvent,
} from "./message-realtime-types";
import {
	getRealtimeWebSocketUrl,
	getReconnectDelay,
	parseNewMessageEvent,
	REALTIME_FALLBACK_INTERVAL_MS,
	REALTIME_HEARTBEAT_INTERVAL_MS,
	showBrowserNewMessageNotification,
} from "./message-realtime-utils";

export function useMessagePolling(): MessageRealtimeState {
	const [notification, setNotification] = useState<NewMessageEvent | null>(null);
	const dismissNotification = useCallback(() => setNotification(null), []);

	useEffect(() => {
		let socket: WebSocket | null = null;
		let reconnectTimer: number | null = null;
		let heartbeatTimer: number | null = null;
		let fallbackTimer: number | null = null;
		let reconnectAttempt = 0;
		let stopped = false;

		function dispatchMessagesChanged() {
			window.dispatchEvent(new Event("mailflare:messages-changed"));
		}

		function clearConnectionTimers() {
			if (reconnectTimer) window.clearTimeout(reconnectTimer);
			if (heartbeatTimer) window.clearInterval(heartbeatTimer);
			if (fallbackTimer) window.clearInterval(fallbackTimer);
			reconnectTimer = null;
			heartbeatTimer = null;
			fallbackTimer = null;
		}

		function startFallbackRefresh() {
			if (fallbackTimer) return;
			fallbackTimer = window.setInterval(
				dispatchMessagesChanged,
				REALTIME_FALLBACK_INTERVAL_MS,
			);
		}

		function scheduleReconnect() {
			if (stopped || !getClientSessionToken()) return;
			startFallbackRefresh();
			const delay = getReconnectDelay(reconnectAttempt);
			reconnectAttempt += 1;
			reconnectTimer = window.setTimeout(connect, delay);
		}

		function connect() {
			clearConnectionTimers();
			if (stopped || !getClientSessionToken()) return;

			socket = new WebSocket(getRealtimeWebSocketUrl());
			socket.onopen = () => {
				reconnectAttempt = 0;
				heartbeatTimer = window.setInterval(() => {
					if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
				}, REALTIME_HEARTBEAT_INTERVAL_MS);
			};
			socket.onmessage = (message) => {
				if (message.data === "pong" || typeof message.data !== "string") return;
				const event = parseNewMessageEvent(message.data);
				if (!event) return;
				dispatchMessagesChanged();
				setNotification(event);
				showBrowserNewMessageNotification(event);
			};
			socket.onerror = () => socket?.close();
			socket.onclose = scheduleReconnect;
		}

		function restartForSessionChange() {
			if (socket) {
				socket.onclose = null;
				socket.close(1000, "Session changed");
				socket = null;
			}
			clearConnectionTimers();
			reconnectAttempt = 0;
			setNotification(null);
			if (getClientSessionToken()) connect();
		}

		window.addEventListener(AUTH_SESSION_CHANGED_EVENT, restartForSessionChange);
		connect();

		return () => {
			stopped = true;
			window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, restartForSessionChange);
			clearConnectionTimers();
			if (socket) {
				socket.onclose = null;
				socket.close(1000, "Client closed");
			}
		};
	}, []);

	useEffect(() => {
		if (!notification) return;
		const timer = window.setTimeout(() => setNotification(null), 8_000);
		return () => window.clearTimeout(timer);
	}, [notification]);

	return { notification, dismissNotification };
}
