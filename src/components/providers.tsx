"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { clearMailboxClientState } from "@/components/mailbox-provider-utils";
import { BrandingProvider } from "@/components/branding-provider";
import { NewMessagePopup } from "@/components/new-message-popup";
import { useMessagePolling } from "@/hooks/use-message-polling";
import { clearMessageClientState } from "@/hooks/utils";
import { clearMessageDetailCache } from "@/lib/messages/detail-cache";
import { AUTH_SESSION_CHANGED_EVENT } from "@/lib/auth/client";
import { startTranslation } from "@/lib/i18n/runtime";

export function Providers({ children }: { children: React.ReactNode }) {
	const realtime = useMessagePolling();

	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnMount: false,
						refetchOnReconnect: false,
						refetchOnWindowFocus: false,
						staleTime: 60_000,
					},
				},
			}),
	);

	useEffect(() => {
		function resetUserScopedState() {
			client.clear();
			clearMailboxClientState();
			clearMessageClientState();
			clearMessageDetailCache();
		}

		window.addEventListener(AUTH_SESSION_CHANGED_EVENT, resetUserScopedState);
		return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, resetUserScopedState);
	}, [client]);

	// Runtime UI translation (Chinese by default, toggle to English).
	useEffect(() => {
		startTranslation();
	}, []);

	// Register the service worker so the app is installable (PWA).
	useEffect(() => {
		if ("serviceWorker" in navigator && window.location.protocol === "https:") {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				// Installability is a progressive enhancement; ignore failures.
			});
		}
	}, []);

	return (
		<QueryClientProvider client={client}>
			<BrandingProvider>
				{children}
				{realtime.notification && (
					<NewMessagePopup
						notification={realtime.notification}
						onDismiss={realtime.dismissNotification}
					/>
				)}
			</BrandingProvider>
		</QueryClientProvider>
	);
}
