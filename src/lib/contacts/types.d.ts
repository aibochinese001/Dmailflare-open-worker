import type { contacts } from "@/db/schema";
import type { ContactSource } from "@/lib/email/address-types";

export type ContactRow = typeof contacts.$inferSelect;

export type ContactInput = {
	userId: string;
	address: string;
	source: ContactSource;
};

export type BlockContactInput = {
	userId: string;
	mailboxId: string;
	domainId: string;
	address: string;
};

export type MessageContactNames = {
	fromContactName: string | null;
	toContactName: string | null;
};
