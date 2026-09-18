import type { BulkMessageAction } from "./types";

const allowedBulkActions = new Set<BulkMessageAction>([
	"archive",
	"trash",
	"spam",
	"read",
	"unread",
	"inbox",
	"folder",
]);

export function isAllowedBulkMessageAction(action: unknown): action is BulkMessageAction {
	return typeof action === "string" && allowedBulkActions.has(action as BulkMessageAction);
}

export function getStatusForBulkAction(action: BulkMessageAction): string | null {
	if (action === "archive") return "archived";
	if (action === "trash") return "trash";
	if (action === "spam") return "spam";
	if (action === "inbox") return "received";
	if (action === "folder") return "received";
	return null;
}

export function getReadValueForBulkAction(action: BulkMessageAction): boolean | null {
	if (action === "read") return true;
	if (action === "unread") return false;
	return null;
}
