import type { BackupSettingsInput } from "./types";

const SCHEDULE_TYPES = new Set(["daily", "weekly", "monthly"]);

export function parseBackupSettingsInput(value: unknown): BackupSettingsInput | null {
	if (!value || typeof value !== "object") return null;
	const input = value as Record<string, unknown>;
	if (typeof input.enabled !== "boolean") return null;
	if (typeof input.scheduleType !== "string" || !SCHEDULE_TYPES.has(input.scheduleType)) return null;
	if (typeof input.retentionEnabled !== "boolean") return null;

	const retentionDays = Number(input.retentionDays);
	if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) return null;

	let scheduleValue: number | null = null;
	if (input.scheduleType === "weekly") {
		scheduleValue = Number(input.scheduleValue);
		if (!Number.isInteger(scheduleValue) || scheduleValue < 0 || scheduleValue > 6) return null;
	}
	if (input.scheduleType === "monthly") {
		scheduleValue = Number(input.scheduleValue);
		if (!Number.isInteger(scheduleValue) || scheduleValue < 1 || scheduleValue > 28) return null;
	}

	return {
		enabled: input.enabled,
		scheduleType: input.scheduleType as BackupSettingsInput["scheduleType"],
		scheduleValue,
		retentionEnabled: input.retentionEnabled,
		retentionDays,
	};
}
