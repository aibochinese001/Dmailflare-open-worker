/**
 * A user's primary mailbox is the one at their account address. It carries the
 * account identity: its name and avatar are the profile's, and editing either
 * side keeps both in step. Every other personal mailbox owns its own display
 * name and avatar, so renaming one never touches its siblings.
 */
export type MailboxIdentityScope = {
	localPart: string;
	hostname: string;
	type?: string | null;
};

export function mailboxAddress(mailbox: Pick<MailboxIdentityScope, "localPart" | "hostname">): string {
	return `${mailbox.localPart}@${mailbox.hostname}`.trim().toLowerCase();
}

export function isPrimaryMailbox(
	mailbox: Pick<MailboxIdentityScope, "localPart" | "hostname">,
	accountEmail: string | null | undefined,
): boolean {
	if (!accountEmail) return false;
	return mailboxAddress(mailbox) === accountEmail.trim().toLowerCase();
}

/** True when the mailbox's name and avatar come from the account profile. */
export function tracksAccountIdentity(
	mailbox: MailboxIdentityScope,
	accountEmail: string | null | undefined,
): boolean {
	return mailbox.type === "personal" && isPrimaryMailbox(mailbox, accountEmail);
}

/** The name to show for a mailbox, before falling back to its local part. */
export function resolveMailboxDisplayName(
	mailbox: MailboxIdentityScope & { displayName: string | null },
	accountEmail: string | null | undefined,
	accountName: string | null,
): string | null {
	return tracksAccountIdentity(mailbox, accountEmail) ? accountName : mailbox.displayName;
}

/** The avatar key to serve for a mailbox. */
export function resolveMailboxAvatarKey(
	mailbox: MailboxIdentityScope & { avatarKey: string | null },
	accountEmail: string | null | undefined,
	accountAvatarKey: string | null,
): string | null {
	return tracksAccountIdentity(mailbox, accountEmail) ? accountAvatarKey : mailbox.avatarKey;
}
