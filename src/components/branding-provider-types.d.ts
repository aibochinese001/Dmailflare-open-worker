import type { Branding } from "@/lib/branding/types";

export type BrandingContextValue = Branding & {
	iconUrl: string;
	refreshBranding(): Promise<void>;
};
