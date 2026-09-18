export type AccountListItem = {
	id: string;
	email: string;
	name: string;
	resetEmail: string | null;
	role: "admin" | "user";
	createdAt: Date;
	hasAvatar?: boolean;
	canManageMailboxes?: boolean;
	mailboxId: string | null;
	localPart: string | null;
	hostname: string | null;
};

export type CreateAccountResult = {
	id?: string;
	email?: string;
	mailboxId?: string;
	error?: unknown;
};

export type CreateUserAccountInput = {
	username: string;
	domainId: string;
	password: string;
	role: "admin" | "user";
};

export type AccountListResponse = {
	accounts?: AccountListItem[];
	error?: string;
};
