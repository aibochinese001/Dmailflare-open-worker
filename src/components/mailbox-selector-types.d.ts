import type { MailboxOption } from "./mailbox-provider";

export type MailboxSelectorUser = {
	id: string;
	email: string;
	name: string;
	role: "admin" | "user";
	hasAvatar: boolean;
};

export type AccountAvatarProps = {
	name: string;
	hasAvatar?: boolean;
	avatarUrl?: string;
	size?: "small" | "large";
	onAvatarError?: () => void;
};

export type MailboxAccountRowProps = {
	mailbox: MailboxOption;
	unread: number;
	avatarUrl?: string;
	onSelect: () => void;
};
