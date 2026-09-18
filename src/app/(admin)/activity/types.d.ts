export type ActivityMetadata = {
	ipAddress?: string;
	city?: string | null;
	country?: string | null;
	device?: string;
	platform?: string;
	userAgent?: string;
};

export type ActivityLog = {
	id: string;
	action: "auth.login" | "auth.logout" | string;
	metadata: string | null;
	createdAt: string;
	actorEmail: string | null;
};
