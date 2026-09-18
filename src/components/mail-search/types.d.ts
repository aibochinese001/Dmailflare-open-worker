export type MailSearchContextValue = {
	/** Debounced value lists fetch with. */
	query: string;
	/** Live value of the search box. */
	input: string;
	setQuery: (query: string) => void;
};
