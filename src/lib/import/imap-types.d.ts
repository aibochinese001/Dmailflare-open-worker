export type ImapImportInput = {
	host: string;
	port: number;
	secure: boolean;
	username: string;
	password: string;
	folder: string;
	limit: number;
};
