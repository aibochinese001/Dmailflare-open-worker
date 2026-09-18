export type LicensePlan = "community" | "pro" | "team";

export type LicenseState = "inactive" | "active" | "invalid" | "expired" | "deactivated";

export type PaymugLicenseAction = "activate" | "validate" | "deactivate";

export type PaymugLicenseResponse = {
	valid: boolean;
	state: Exclude<LicenseState, "inactive">;
	instanceId?: string;
	productId?: string;
	plan?: string;
	features?: string[];
};

export type LicenseStatus = {
	plan: LicensePlan;
	state: LicenseState;
	features: string[];
	instanceId: string;
	instanceUrl: string | null;
	active: boolean;
	activatedAt: Date | null;
	validatedAt: Date | null;
};

export type LicenseActivationInput = {
	licenseKey: string;
	productId: string;
	instanceId: string;
	instanceUrl: string;
	appVersion: string;
};

export type LicenseDeactivationInput = {
	productId: string;
	instanceId: string;
};

export type LicenseEntitlements = {
	plan: LicensePlan;
	canCustomizeBranding: boolean;
	canManageAccounts: boolean;
	canForwardEmail: boolean;
};
