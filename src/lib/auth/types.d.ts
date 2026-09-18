export type UserRole = "admin" | "user";

export type SessionUser = {
	id: string;
	email: string;
	resetEmail: string | null;
	forwardingEmail: string | null;
	passwordHash: string;
	name: string;
	role: UserRole;
	disabled: boolean;
	canManageMailboxes: boolean;
	keyboardShortcutsEnabled: boolean;
	spamProtectionEnabled: boolean;
	createdByUserId: string | null;
	createdAt: Date;
};
