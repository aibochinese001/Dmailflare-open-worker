"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SidebarProviderProps, SidebarState } from "./sidebar-state-types";

const SidebarContext = createContext<SidebarState>({ minimal: false, toggle: () => undefined });

export function SidebarProvider({ children, expandedWidth = 240 }: SidebarProviderProps) {
	const [minimal, setMinimal] = useState(false);
	const [storageKey, setStorageKey] = useState<string | null>(null);

	useEffect(() => {
		// The sidebar preference is cosmetic, so every failure here degrades to the default.
		// Guard the parse: an error response may carry an empty or non-JSON body, and an
		// unhandled rejection here surfaces as a confusing SyntaxError overlay in dev.
		void fetch("/api/auth/me", { cache: "no-store" })
			.then(async (response) => {
				if (!response.ok) return null;
				return (await response.json().catch(() => null)) as { user?: { id?: string } } | null;
			})
			.then((data) => {
				const userId = data?.user?.id;
				if (!userId) return;
				const key = `mailflare-sidebar-minimal:${userId}`;
				setStorageKey(key);
				try {
					setMinimal(localStorage.getItem(key) === "true");
				} catch {
					// Storage can be unavailable in private windows; keep the default.
				}
			})
			.catch(() => undefined);
	}, []);

	function toggle() {
		setMinimal((current) => {
			const next = !current;
			if (storageKey) localStorage.setItem(storageKey, String(next));
			return next;
		});
	}

	return (
		<SidebarContext.Provider value={{ minimal, toggle }}>
			<div className="h-full" style={{ "--sidebar-width": `${minimal ? 72 : expandedWidth}px` } as React.CSSProperties}>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	return useContext(SidebarContext);
}
