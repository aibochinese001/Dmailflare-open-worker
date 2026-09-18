import { and, eq, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import { sendEmail } from "@/lib/email/send";
import { createCalendarInvitation } from "@/lib/calendar/utils";
import type { CalendarEventInput } from "./types";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const start = new Date(url.searchParams.get("start") ?? Date.now());
	const end = new Date(url.searchParams.get("end") ?? start.getTime() + 31 * 86_400_000);
	const events = await getDb(env).select().from(calendarEvents).where(and(eq(calendarEvents.userId, user.id), gte(calendarEvents.startsAt, start), lt(calendarEvents.startsAt, end))).orderBy(calendarEvents.startsAt);
	return NextResponse.json({ events });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const input = await request.json() as CalendarEventInput;
	const startsAt = new Date(input.startsAt);
	const endsAt = new Date(input.endsAt);
	if (!input.title?.trim() || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: "Enter a title and valid event times" }, { status: 400 });
	const attendees = (input.attendees ?? []).map((email) => email.trim()).filter((email) => /^\S+@\S+\.\S+$/.test(email));
	const event = { id: newId("evt"), userId: user.id, mailboxId: input.mailboxId ?? null, title: input.title.trim(), description: input.description?.trim() ?? "", location: input.location?.trim() ?? "", attendees: JSON.stringify(attendees), startsAt, endsAt };
	await getDb(env).insert(calendarEvents).values(event);
	if (attendees.length && input.mailboxId) {
		const calendarFile = createCalendarInvitation({ ...event, uid: event.id });
		await Promise.all(attendees.map((to) => sendEmail(env, { userId: user.id, mailboxId: input.mailboxId!, from: input.from ?? "", to, subject: `Invitation: ${event.title}`, text: event.description || `You are invited to ${event.title}.`, attachments: [{ filename: "invite.ics", type: "text/calendar; charset=utf-8", content: calendarFile }] })));
	}
	return NextResponse.json({ event });
}
