export type AccountMailboxesRouteParams = {
	params: Promise<{ id: string }>;
};

export type AccountMailboxItem = {
	id: string;
	domainId: string;
	localPart: string;
	hostname: string;
	displayName: string | null;
	type: "personal" | "shared";
	createdAt: Date;
};
