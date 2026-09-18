import type { MailboxAvatarChangedDetail } from "./avatar-client-types";

export const MAILBOX_AVATAR_CHANGED_EVENT = "mailflare:mailbox-avatar-changed";

export function dispatchMailboxAvatarChanged(mailboxId: string, url: string): void {
	window.dispatchEvent(
		new CustomEvent<MailboxAvatarChangedDetail>(MAILBOX_AVATAR_CHANGED_EVENT, {
			detail: { mailboxId, url },
		}),
	);
}
