import type { MailboxOption } from "./mailbox-provider";

export function getMailboxAddress(mailbox: MailboxOption): string {
	return `${mailbox.localPart}@${mailbox.hostname}`;
}

export function getMailboxName(mailbox: MailboxOption): string {
	return mailbox.displayName ?? mailbox.localPart;
}

export function getAccountInitial(value: string): string {
	return value.trim().slice(0, 1).toUpperCase() || "M";
}

export function isAdminPath(pathname: string): boolean {
	return (
		pathname === "/admin" ||
		pathname.startsWith("/mailboxes") ||
		pathname.startsWith("/domains") ||
		pathname.startsWith("/api-keys") ||
		pathname.startsWith("/webhooks") ||
		pathname.startsWith("/activity") ||
		pathname.startsWith("/backups")
	);
}
