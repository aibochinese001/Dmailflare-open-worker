"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { BrandingContextValue } from "./branding-provider-types";
import { DEFAULT_BRANDING, fetchBranding } from "./branding-provider-utils";

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
	const [branding, setBranding] = useState(DEFAULT_BRANDING);
	const [iconVersion, setIconVersion] = useState(0);

	async function refreshBranding() {
		const nextBranding = await fetchBranding();
		setBranding(nextBranding);
		setIconVersion(Date.now());
		if (document.title === "Mailflare" || document.title === branding.appName) {
			document.title = nextBranding.appName;
		}
	}

	useEffect(() => {
		void refreshBranding();
	}, []);

	return (
		<BrandingContext.Provider value={{
			...branding,
			iconUrl: branding.hasCustomIcon ? `/api/branding/icon?v=${iconVersion}` : "/icons/icon.svg",
			refreshBranding,
		}}>
			{children}
		</BrandingContext.Provider>
	);
}

export function useBranding() {
	return useContext(BrandingContext) ?? {
		...DEFAULT_BRANDING,
		iconUrl: "/icons/icon.svg",
		refreshBranding: async () => undefined,
	};
}
