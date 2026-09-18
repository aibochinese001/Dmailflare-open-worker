import type { LucideIcon } from "lucide-react";
import type { LicenseStatus } from "@/lib/licenses/types";

export type LicensePlan = {
	name: string;
	price: number;
	description: string;
	features: string[];
	icon: LucideIcon;
	checkoutUrl: string;
	originalPrice?: number,
};

export type LicenseAction = "activate" | "validate" | "deactivate";

export type ActivatableLicensePlan = "pro" | "team";

export type LicenseResponse = {
	license?: LicenseStatus;
	error?: string;
};
