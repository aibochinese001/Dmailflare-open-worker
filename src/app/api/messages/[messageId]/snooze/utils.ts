export function getSnoozedUntil(value: unknown): Date | null {
	if (typeof value !== "string") return null;
	const snoozedUntil = new Date(value);
	if (Number.isNaN(snoozedUntil.getTime()) || snoozedUntil <= new Date()) return null;
	return snoozedUntil;
}
