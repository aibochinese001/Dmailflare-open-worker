export type ImapImportRequest = {
	mailboxId?: string;
	host?: string;
	port?: number;
	secure?: boolean;
	username?: string;
	password?: string;
	folder?: string;
	limit?: number;
	destination?: string;
};
