import { getEmailAddress, getEmailDisplayName, splitEmailAddressList } from "@/lib/email/address";
import type { ThreadMessage } from "@/hooks/types";

/** Messages on one side of the current one, in chronological order. */
export function partitionThread(
	messages: ThreadMessage[],
	currentMessageId: string,
	position: "before" | "after",
	latestMessagesFirst: boolean,
): ThreadMessage[] {
	const index = messages.findIndex((message) => message.id === currentMessageId);
	const slice = index < 0
		? position === "before" ? messages : []
		: position === "before" ? messages.slice(0, index) : messages.slice(index + 1);
	return latestMessagesFirst ? [...slice].reverse() : slice;
}

export function getConversationSender(message: ThreadMessage, currentAccountName?: string): string {
	if (message.direction === "outbound") return currentAccountName ?? getEmailDisplayName(message.fromAddr);
	return message.fromContactName ?? getEmailDisplayName(message.fromAddr);
}

export function getConversationSenderEmail(message: ThreadMessage): string {
	if (message.direction === "outbound") return getEmailAddress(message.fromAddr);
	return getEmailAddress(message.fromAddr);
}


/** "to Maya, Sam" style summary for a collapsed card. */
export function getConversationRecipients(message: ThreadMessage): string {
	const names = [...splitEmailAddressList(message.toAddr), ...splitEmailAddressList(message.ccAddr)].map(
		(entry) => getEmailDisplayName(entry),
	);
	if (names.length === 0) return "";
	if (names.length <= 3) return names.join(", ");
	return `${names.slice(0, 3).join(", ")}, +${names.length - 3}`;
}

export function getAvatarInitial(message: ThreadMessage, currentAccountName?: string): string {
	const name = getConversationSender(message, currentAccountName) || getEmailAddress(message.fromAddr);
	return name.trim().charAt(0).toUpperCase() || "?";
}
