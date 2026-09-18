export type ManagedAccount = {
	id: string;
	email: string;
	name: string;
	role: "admin" | "user";
	disabled: boolean;
	canManageMailboxes: boolean;
	forwardingEmail: string | null;
	canForwardEmail: boolean;
	hasAvatar: boolean;
	/** Only ever set client-side when an admin types a new password; never returned by the API. */
	newPassword?: string;
};

export type ManagedMailbox = {
	id: string;
	localPart: string;
	displayName: string | null;
	domainId: string;
	hostname: string;
};

export type ManagedDomain = { id: string; hostname: string };

export type ManagedAccountResponse = {
	account?: ManagedAccount;
	error?: string;
};

export type AccountDetail = ManagedAccount;
export type DomainOption = ManagedDomain;
export type AccountMailboxItem = ManagedMailbox;

export type AccountDetailResponse = ManagedAccountResponse;

export type AccountMailboxAccessItem = ManagedMailbox & {
	mailboxId: string;
	permission?: "read_only" | "send_as" | "send_on_behalf" | "full_access";
};

export type AccountMailboxAccessResponse = {
	mailboxes: AccountMailboxAccessItem[];
	error?: string;
};
