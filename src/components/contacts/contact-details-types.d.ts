export type ContactDetailsRecord = {
	email: string;
	displayName: string | null;
	hasAvatar: boolean;
	source: "manual" | "inbound" | "outbound" | null;
	blocked: boolean;
	lastSeenAt: string | null;
};

export type ContactDetailsResponse = {
	contact?: ContactDetailsRecord;
	error?: string;
};

export type ContactDetailsTriggerProps = {
	mailboxId: string | null;
	address: string;
	name: string;
	className?: string;
};
