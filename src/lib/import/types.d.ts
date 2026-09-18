export type ImportMailboxResult = {
	imported: number;
	skipped: number;
	errors: string[];
};

export type ImportMessageInput = {
	filename: string;
	raw: ArrayBuffer;
};
