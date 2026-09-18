export type SetupRequirementCheck = {
	key: string;
	configured: boolean;
	message: string;
};

export type SetupPreparationResult = {
	checks: SetupRequirementCheck[];
	migrated: boolean;
};
