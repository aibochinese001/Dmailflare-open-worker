import type { MessageDragPayload } from "./drag-types";

export const MESSAGE_DRAG_MIME = "application/x-mailflare-message-ids";

export function setMessageDragData(dataTransfer: DataTransfer, payload: MessageDragPayload): void {
	dataTransfer.effectAllowed = "move";
	dataTransfer.setData(MESSAGE_DRAG_MIME, JSON.stringify(payload));
	dataTransfer.setData("text/plain", payload.messageIds.join(","));
}

export function getMessageDragData(dataTransfer: DataTransfer): MessageDragPayload | null {
	const raw = dataTransfer.getData(MESSAGE_DRAG_MIME);
	if (!raw) return null;

	try {
		const payload = JSON.parse(raw) as Partial<MessageDragPayload>;
		const messageIds = payload.messageIds?.filter(Boolean) ?? [];
		return messageIds.length > 0 ? { messageIds } : null;
	} catch {
		return null;
	}
}
