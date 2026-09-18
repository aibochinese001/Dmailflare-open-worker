import { useEffect, useState } from "react";
import type { MessageCounts, MessageCountsDelta } from "./types";
import { clearMessageCountsCache, fetchMessageCounts } from "./utils";

const emptyCounts: MessageCounts = {
	folders: {
		inbox: { total: 0, unread: 0 },
		starred: { total: 0, unread: 0 },
		snoozed: { total: 0, unread: 0 },
		sent: { total: 0, unread: 0 },
		drafts: { total: 0, unread: 0 },
		archived: { total: 0, unread: 0 },
		spam: { total: 0, unread: 0 },
		trash: { total: 0, unread: 0 },
	},
	customFolders: {},
	mailboxes: [],
};

export function useMessageCounts(mailboxId?: string | null, enabled = true) {
	const [counts, setCounts] = useState<MessageCounts>(emptyCounts);
	const [isLoading, setIsLoading] = useState(enabled);

	useEffect(() => {
		if (!enabled) {
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		async function loadCounts(force = false) {
			setIsLoading(true);
			try {
				const nextCounts = await fetchMessageCounts(mailboxId, force);
				if (!cancelled) setCounts(nextCounts ?? emptyCounts);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void loadCounts();
		function onMessagesChanged() {
			clearMessageCountsCache();
			void loadCounts(true);
		}
		function onMessageCountsDelta(event: Event) {
			const detail = (event as CustomEvent<MessageCountsDelta>).detail;
			if (!detail?.inboxUnreadDelta) return;
			setCounts((current) => ({
				...current,
				folders: {
					...current.folders,
					inbox: {
						...current.folders.inbox,
						unread: Math.max(0, current.folders.inbox.unread + detail.inboxUnreadDelta),
					},
				},
			}));
		}
		window.addEventListener("mailflare:messages-changed", onMessagesChanged);
		window.addEventListener("mailflare:message-counts-changed", onMessagesChanged);
		window.addEventListener("mailflare:message-counts-delta", onMessageCountsDelta);
		const refreshInterval = window.setInterval(() => void loadCounts(true), 15_000);

		return () => {
			cancelled = true;
			window.removeEventListener("mailflare:messages-changed", onMessagesChanged);
			window.removeEventListener("mailflare:message-counts-changed", onMessagesChanged);
			window.removeEventListener("mailflare:message-counts-delta", onMessageCountsDelta);
			window.clearInterval(refreshInterval);
		};
	}, [enabled, mailboxId]);

	return { counts, isLoading };
}
