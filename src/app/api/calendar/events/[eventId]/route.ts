import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { createCalendarInvitation } from "@/lib/calendar/utils";
import { sendEmail } from "@/lib/email/send";
import type { CalendarEventInput } from "../types";
import type { CalendarEventRouteParams } from "./types";

export async function PATCH(request: Request, { params }: CalendarEventRouteParams) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const { eventId } = await params;
	const input = await request.json() as CalendarEventInput;
	const startsAt = new Date(input.startsAt);
	const endsAt = new Date(input.endsAt);
	if (!input.title?.trim() || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: "Enter a title and valid event times" }, { status: 400 });
	const db = getDb(env);
	const [existing] = await db.select().from(calendarEvents).where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id))).limit(1);
	if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
	const attendees = (input.attendees ?? []).map((email) => email.trim()).filter((email) => /^\S+@\S+\.\S+$/.test(email));
	const event = { ...existing, title: input.title.trim(), description: input.description?.trim() ?? "", location: input.location?.trim() ?? "", attendees: JSON.stringify(attendees), startsAt, endsAt };
	await db.update(calendarEvents).set({ title: event.title, description: event.description, location: event.location, attendees: event.attendees, startsAt, endsAt, updatedAt: new Date() }).where(eq(calendarEvents.id, eventId));
	if (attendees.length && existing.mailboxId && input.from) { const file = createCalendarInvitation({ ...event, uid: eventId }); await Promise.all(attendees.map((to) => sendEmail(env, { userId: user.id, mailboxId: existing.mailboxId!, from: input.from!, to, subject: `Updated invitation: ${event.title}`, text: event.description || `This event has been updated: ${event.title}.`, attachments: [{ filename: "invite.ics", type: "text/calendar; charset=utf-8", content: file }] }))); }
	return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: CalendarEventRouteParams) {
	const env = getEnv();
	const user = await requireUser(env, _request);
	const { eventId } = await params;
	await getDb(env).delete(calendarEvents).where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id)));
	return NextResponse.json({ ok: true });
}
