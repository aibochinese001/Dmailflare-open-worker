import type { LicensePlan, LicenseStatus } from "@/lib/licenses/types";

export type LicenseKeyRequest = {
	licenseKey: string;
	plan?: Exclude<LicensePlan, "community">;
};

export type LicenseApiResponse = {
	license?: LicenseStatus;
	error?: string;
};
