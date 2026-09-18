import { authFetch } from "@/lib/auth/client";
import { clearMailboxesCache } from "@/components/mailbox-provider-utils";
import type { ProfileAvatarUploadResponse } from "./types";

export const PROFILE_AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_PROFILE_AVATAR_SIZE = 2 * 1024 * 1024;

export function validateProfileAvatar(file: File): string | null {
	if (!PROFILE_AVATAR_ACCEPT.split(",").includes(file.type)) {
		return "Use a JPEG, PNG, WebP, or GIF image";
	}
	if (file.size > MAX_PROFILE_AVATAR_SIZE) {
		return "Image must be 2 MB or smaller";
	}
	return null;
}

export async function uploadProfileAvatar(file: File): Promise<void> {
	const body = new FormData();
	body.append("file", file, file.name);
	const response = await authFetch("/api/profile/avatar", { method: "POST", body });
	if (response.ok) return;

	const data = (await response.json().catch(() => null)) as ProfileAvatarUploadResponse | null;
	throw new Error(data?.error ?? "Upload failed");
}

export function getMailboxProfileAvatarUrl(mailboxId: string): string {
	return `/api/mailboxes/${mailboxId}/avatar?v=${Date.now()}`;
}

export async function uploadMailboxProfileAvatar(mailboxId: string, file: File): Promise<void> {
	const body = new FormData();
	body.append("file", file, file.name);
	const response = await authFetch(`/api/mailboxes/${mailboxId}/avatar`, {
		method: "POST",
		body,
	});
	if (response.ok) {
		clearMailboxesCache();
		return;
	}

	const data = (await response.json().catch(() => null)) as ProfileAvatarUploadResponse | null;
	throw new Error(data?.error ?? "Upload failed");
}
