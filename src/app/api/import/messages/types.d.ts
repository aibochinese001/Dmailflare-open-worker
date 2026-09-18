export type ImportMessagesResponse = {
	imported?: number;
	skipped?: number;
	errors?: string[];
	error?: string;
};
