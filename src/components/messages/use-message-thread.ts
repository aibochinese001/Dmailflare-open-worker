import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import type { ThreadMessage, ThreadResponse } from "@/hooks/types";
import type { UseMessageThreadResult } from "./conversation-thread-types";

/** Loads every message in the conversation of `messageId`; refetches when mail changes. */
export function useMessageThread(messageId: string, threadId: string | null | undefined): UseMessageThreadResult {
	const [messages, setMessages] = useState<ThreadMessage[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!threadId) return;
		let cancelled = false;
		async function load() {
			setLoading(true);
			try {
				const response = await authFetch(`/api/messages/${messageId}/thread`);
				const data = (await response.json()) as ThreadResponse;
				if (!cancelled) setMessages(response.ok ? data.messages ?? [] : []);
			} catch {
				if (!cancelled) setMessages([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void load();
		window.addEventListener("mailflare:messages-changed", load);
		return () => {
			cancelled = true;
			window.removeEventListener("mailflare:messages-changed", load);
		};
	}, [messageId, threadId]);

	return { messages: threadId ? messages : [], loading };
}
