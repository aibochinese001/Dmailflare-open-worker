export type ContactAvatarFormProps = {
	mailboxId: string;
	address: string;
	name: string;
	hasAvatar: boolean;
	onAvatarChange: (hasAvatar: boolean) => void;
};
