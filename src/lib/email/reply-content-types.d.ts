export type PreviousMessageDirection = "received" | "sent";

export type QuotedEmailContent = {
	dateLine: string;
	direction: PreviousMessageDirection;
	content: string;
	quotedContent: QuotedEmailContent[];
};

export type ReplyContentParts = {
	latestContent: string;
	quotedContent: QuotedEmailContent[];
};

export type SplitReplyContentOptions = {
	ownAddress?: string;
};
