type CalendarInvitationInput = {
	title: string;
	description: string;
	location: string;
	startsAt: Date;
	endsAt: Date;
	uid: string;
	method?: "REQUEST" | "CANCEL";
};

function escapeCalendarText(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function formatCalendarDate(value: Date): string {
	return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function createCalendarInvitation(input: CalendarInvitationInput): Uint8Array {
	const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mailflare//Calendar//EN", "CALSCALE:GREGORIAN", `METHOD:${input.method ?? "REQUEST"}`, "BEGIN:VEVENT", `UID:${input.uid}@mailflare`, `DTSTAMP:${formatCalendarDate(new Date())}`, `DTSTART:${formatCalendarDate(input.startsAt)}`, `DTEND:${formatCalendarDate(input.endsAt)}`, `SUMMARY:${escapeCalendarText(input.title)}`, `DESCRIPTION:${escapeCalendarText(input.description)}`, `LOCATION:${escapeCalendarText(input.location)}`, "END:VEVENT", "END:VCALENDAR"];
	return new TextEncoder().encode(lines.join("\r\n"));
}
