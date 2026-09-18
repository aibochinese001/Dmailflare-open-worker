import type { mailboxes } from "@/db/schema";

export type SeedMailboxKey = "support" | "billing";

export type SeedMailboxMap = Record<SeedMailboxKey, typeof mailboxes.$inferSelect>;

export type SeedMessageStatus =
	| "received"
	| "sent"
	| "draft"
	| "trash"
	| "spam"
	| "queued"
	| "failed";

export type SeedMessageDefinition = {
	mailbox: SeedMailboxKey;
	direction: "inbound" | "outbound";
	status: SeedMessageStatus;
	fromAddr: string;
	toAddr: string;
	subject: string;
	textBody: string;
	read?: boolean;
	minutesAgo: number;
	providerMessageId?: string;
};
