import type { NewMessageEvent } from "@/hooks/message-realtime-types";

export interface NewMessagePopupProps {
	notification: NewMessageEvent;
	onDismiss: () => void;
}
