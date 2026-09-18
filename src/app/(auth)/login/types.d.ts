export type LoginResult = {
	token?: string;
	redirect?: string;
	error?: string;
	/** Password accepted; a code from the authenticator is still needed. */
	mfaRequired?: boolean;
	challengeToken?: string;
};
