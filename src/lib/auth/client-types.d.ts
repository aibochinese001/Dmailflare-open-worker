export type AuthFetchOptions = RequestInit & {
	redirectOnUnauthorized?: boolean;
};

export type AuthSessionResponse = {
	ok?: boolean;
	token?: string;
	redirect?: string;
	error?: string;
};

export type AuthSessionChangedDetail = {
	authenticated: boolean;
};
