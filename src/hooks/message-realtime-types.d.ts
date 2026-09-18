export interface NewMessageEvent {
	from: string;
	fromName: string | null;
	mailboxId: string;
	messageId: string;
	subject: string | null;
	type: "new_message";
}

export interface MessageRealtimeState {
	dismissNotification: () => void;
	notification: NewMessageEvent | null;
}
