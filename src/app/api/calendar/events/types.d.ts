export type CalendarEventInput = {
	title: string;
	description?: string;
	location?: string;
	attendees?: string[];
	startsAt: string;
	endsAt: string;
	mailboxId?: string | null;
	from?: string;
};
