export type SetupStatus = {
	hasAdminAccount: boolean;
	hasPrimaryDomain: boolean;
	primaryDomain?: { hostname: string; sendingRequested: boolean } | null;
	error?: string;
};

export type SetupRequirementCheck = {
	key: string;
	configured: boolean;
	message: string;
};

export type SetupPreparationResult = {
	checks?: SetupRequirementCheck[];
	migrated?: boolean;
	error?: string;
};

export type DomainPreflight = {
	hostname: string;
	zone: { id: string; name: string };
};

export type DomainSetupResult = {
	domain?: DomainPreflight;
	error?: string;
};

export type RegisterResult = {
	token?: string;
	redirect?: string;
	error?: string;
};
