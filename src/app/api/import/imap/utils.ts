import type { ImapImportInput } from "@/lib/import/imap-types";
import { parseImportDestination } from "@/lib/import/destination";
import type { ImportDestination } from "@/lib/import/destination-types";
import type { ImapImportRequest } from "./types";

export function parseImapImportRequest(input: ImapImportRequest): ImapImportInput & {
	mailboxId: string;
	destination: ImportDestination;
} {
	const host = input.host?.trim() ?? "";
	const port = Number(input.port ?? 993);
	const username = input.username?.trim() ?? "";
	const password = input.password ?? "";
	const folder = input.folder?.trim() || "INBOX";
	const limit = Math.min(Math.max(Number(input.limit ?? 25), 1), 100);
	const destination = parseImportDestination(input.destination);

	if (!input.mailboxId) throw new Error("Mailbox is required");
	if (!host) throw new Error("IMAP host is required");
	if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("IMAP port is invalid");
	if (!username || !password) throw new Error("IMAP username and password are required");

	return {
		mailboxId: input.mailboxId,
		host,
		port,
		secure: input.secure ?? port === 993,
		username,
		password,
		folder,
		limit,
		destination,
	};
}
