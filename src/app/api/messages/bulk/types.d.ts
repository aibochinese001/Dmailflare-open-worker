export type BulkMessageAction = "archive" | "trash" | "spam" | "read" | "unread" | "inbox" | "folder";

export type BulkMessagePayload = {
	messageIds?: string[];
	action?: BulkMessageAction;
	folderId?: string;
};
