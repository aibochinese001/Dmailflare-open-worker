import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { backups, backupSettings } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { BackupScheduleType } from "./types";
import { BACKUP_SETTINGS_ID, getUtcDayBounds, isBackupDue } from "./utils";

export async function getBackupSettings(env: CloudflareEnv) {
	const db = getDb(env);
	const [settings] = await db
		.select()
		.from(backupSettings)
		.where(eq(backupSettings.id, BACKUP_SETTINGS_ID))
		.limit(1);
	return settings;
}

export async function listBackups(env: CloudflareEnv) {
	return getDb(env).select().from(backups).orderBy(desc(backups.createdAt)).limit(100);
}

export async function createBackupRecord(
	env: CloudflareEnv,
	trigger: "manual" | "scheduled",
	createdByUserId?: string,
) {
	const id = newId("bak");
	await getDb(env).insert(backups).values({
		id,
		trigger,
		createdByUserId: createdByUserId ?? null,
	});
	return id;
}

export async function createScheduledBackupIfDue(env: CloudflareEnv, now: Date): Promise<string | null> {
	const settings = await getBackupSettings(env);
	if (!settings?.enabled) return null;
	if (!isBackupDue(settings.scheduleType as BackupScheduleType, settings.scheduleValue, now)) return null;

	const { start, end } = getUtcDayBounds(now);
	const existing = await getDb(env)
		.select({ id: backups.id })
		.from(backups)
		.where(
			and(
				eq(backups.trigger, "scheduled"),
				inArray(backups.status, ["queued", "running", "completed"]),
				gte(backups.createdAt, new Date(start)),
				lt(backups.createdAt, new Date(end)),
			),
		)
		.limit(1);
	if (existing.length) return null;
	return createBackupRecord(env, "scheduled");
}

export async function updateBackupSettings(
	env: CloudflareEnv,
	input: {
		enabled: boolean;
		scheduleType: BackupScheduleType;
		scheduleValue: number | null;
		retentionEnabled: boolean;
		retentionDays: number;
	},
) {
	await getDb(env)
		.update(backupSettings)
		.set({ ...input, updatedAt: new Date() })
		.where(eq(backupSettings.id, BACKUP_SETTINGS_ID));
}

export async function deleteBackup(env: CloudflareEnv, id: string): Promise<boolean> {
	const db = getDb(env);
	const [backup] = await db.select().from(backups).where(eq(backups.id, id)).limit(1);
	if (!backup) return false;
	if (backup.status === "queued" || backup.status === "running") {
		throw new Error("A backup in progress cannot be deleted");
	}
	if (backup.r2Key) await env.BUCKET.delete(backup.r2Key);
	await db.delete(backups).where(eq(backups.id, id));
	return true;
}
