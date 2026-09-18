import { authFetch } from "@/lib/auth/client";
import type { BackupItem, BackupsResponse, BackupSettings } from "./types";

export const WEEKDAYS = [
	{ value: 0, label: "Sunday" },
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
];

export async function fetchBackups(): Promise<BackupsResponse> {
	const response = await authFetch("/api/backups");
	const data = (await response.json()) as BackupsResponse & { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Failed to load backups");
	return data;
}

export async function saveBackupSettings(settings: BackupSettings): Promise<void> {
	const response = await authFetch("/api/backups", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(settings),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Failed to save backup settings");
}

export async function startBackup(): Promise<void> {
	const response = await authFetch("/api/backups", { method: "POST" });
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Failed to run backup");
}

export async function removeBackup(id: string): Promise<void> {
	const response = await authFetch(`/api/backups/${id}`, { method: "DELETE" });
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Failed to delete backup");
}

export async function restoreBackup(file: File): Promise<void> {
	const form = new FormData();
	form.set("backup", file);
	const response = await authFetch("/api/backups/restore", { method: "POST", body: form });
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Failed to restore backup");
}

export async function downloadBackup(backup: BackupItem): Promise<void> {
	const response = await authFetch(`/api/backups/${backup.id}/download`);
	if (!response.ok) {
		const data = (await response.json()) as { error?: string };
		throw new Error(data.error ?? "Failed to download backup");
	}
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = backup.filename ?? `${backup.id}.sql`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function formatBackupDate(value: string | null): string {
	if (!value) return "-";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function formatBackupSize(value: number | null): string {
	if (value === null) return "-";
	if (value < 1024) return `${value} B`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
	return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusClass(status: BackupItem["status"]): string {
	if (status === "completed") return "border-green-200 bg-green-50 text-green-700";
	if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
	if (status === "running") return "border-blue-200 bg-blue-50 text-blue-700";
	return "border-amber-200 bg-amber-50 text-amber-700";
}
