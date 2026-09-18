export type MfaStatus = {
	enabled: boolean;
	confirmedAt: string | null;
	recoveryCodesLeft: number;
};

export type MfaEnrollment = {
	secret: string;
	otpauthUrl: string;
	/** Inline SVG of the otpauth URL, for the enrolment dialog. */
	qrSvg: string;
};
