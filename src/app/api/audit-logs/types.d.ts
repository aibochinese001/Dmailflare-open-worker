export type AuditLogRow = {
	id: string;
	action: string;
	metadata: string | null;
	createdAt: Date;
	actorEmail: string | null;
	targetEmail: string | null;
	mailboxLocalPart: string | null;
	mailboxHostname: string | null;
};
