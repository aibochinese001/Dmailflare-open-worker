export type AccountMailboxAccessRouteParams = {
	params: Promise<{ id: string }>;
};

export type AccountMailboxAccessItem = {
	mailboxId: string;
	localPart: string;
	hostname: string;
	displayName: string | null;
	permission: "read_only" | "send_as" | "send_on_behalf" | "full_access" | null;
};
