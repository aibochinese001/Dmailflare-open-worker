import { useEffect, useState } from "react";
import type { Message, MessageFilterOptions, MessageFolder } from "./types";
import {
	clearMessageCountsCache,
	clearMessageListCache,
	fetchMessageList,
	getMessageQueryParams,
	MESSAGE_POLL_INTERVAL_MS,
} from "./utils";

export function useMessages(
	folder: MessageFolder,
	mailboxId?: string | null,
	filters?: MessageFilterOptions,
	enabled = true,
	folderId?: string | null,
) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [limit, setLimit] = useState(filters?.limit ?? 25);
	const [offset, setOffset] = useState(filters?.offset ?? 0);

	const unreadCount = messages.filter((m) => m.direction === "inbound" && !m.read).length;

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		async function loadMessages(force = false, showLoading = false) {
			if (showLoading) setIsLoading(true);
			try {
				const params = getMessageQueryParams(folder, mailboxId, filters, folderId);
				const data = await fetchMessageList(params, force);
				if (!cancelled) {
					setMessages(data.messages ?? []);
					setTotal(data.total ?? 0);
					setLimit(data.limit ?? filters?.limit ?? 25);
					setOffset(data.offset ?? filters?.offset ?? 0);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void loadMessages(false, true);
		function onMessagesChanged() {
			clearMessageListCache();
			clearMessageCountsCache();
			void loadMessages(true);
		}
		window.addEventListener("mailflare:messages-changed", onMessagesChanged);
		const refreshInterval = window.setInterval(() => void loadMessages(true), MESSAGE_POLL_INTERVAL_MS);

		return () => {
			cancelled = true;
			window.removeEventListener("mailflare:messages-changed", onMessagesChanged);
			window.clearInterval(refreshInterval);
		};
	}, [enabled, filters?.group, filters?.limit, filters?.offset, filters?.query, filters?.read, filters?.title, folder, folderId, mailboxId]);

	return { messages, unreadCount, isLoading, total, limit, offset, updateMessages: setMessages };
}
