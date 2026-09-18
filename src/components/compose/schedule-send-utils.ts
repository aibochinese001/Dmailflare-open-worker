import type { ScheduleSendOption } from "./schedule-send-types";

function atTime(date: Date, hours: number): Date {
	const result = new Date(date);
	result.setHours(hours, 0, 0, 0);
	return result;
}

export function getScheduleSendOptions(now = new Date()): ScheduleSendOption[] {
	const laterToday = new Date(now.getTime() + 3 * 60 * 60 * 1000);
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const monday = new Date(now);
	const daysUntilMonday = ((8 - monday.getDay()) % 7) || 7;
	monday.setDate(monday.getDate() + daysUntilMonday);

	return [
		{ label: "Later today", value: laterToday },
		{ label: "Tomorrow morning", value: atTime(tomorrow, 8) },
		{ label: "Monday morning", value: atTime(monday, 8) },
	];
}

export function formatScheduledSend(value: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(value);
}

export function formatDateTimeLocal(value: Date): string {
	const offset = value.getTimezoneOffset() * 60 * 1000;
	return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function parseDateTimeLocal(value: string): Date | null {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}
