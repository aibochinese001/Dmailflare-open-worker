export type ContactAvatarProps = {
	mailboxId: string | null;
	address: string;
	name: string;
	hasManagedAvatar?: boolean;
	managedAvatarUrl?: string;
	className?: string;
};
