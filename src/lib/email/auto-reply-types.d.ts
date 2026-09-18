export type MailboxAutoReplyInput = {
	mailboxId: string;
	userId: string;
	deliveredAddress: string;
	fromAddress: string;
	incomingMessageId?: string | null;
	headers?: Record<string, string>;
};
