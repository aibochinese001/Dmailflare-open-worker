import { authFetch } from "@/lib/auth/client";
import type { ActivityLog, ActivityMetadata } from "./types";

export async function fetchActivity(): Promise<ActivityLog[]> {
	const res = await authFetch("/api/activity");
	const json = (await res.json()) as { activities?: ActivityLog[]; error?: string };
	if (!res.ok) throw new Error(json.error ?? "Failed to load activity");
	return json.activities ?? [];
}

export function formatActivityDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function getActivityLabel(action: string): string {
	if (action === "auth.login") return "Login";
	if (action === "auth.logout") return "Logout";
	return action;
}

export function getActivityMetadata(log: ActivityLog): ActivityMetadata {
	if (!log.metadata) return {};
	try {
		return JSON.parse(log.metadata) as ActivityMetadata;
	} catch {
		return {};
	}
}
