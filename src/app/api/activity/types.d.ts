export type ActivityLogRow = {
	id: string;
	action: string;
	metadata: string | null;
	createdAt: Date;
	actorEmail: string | null;
};
