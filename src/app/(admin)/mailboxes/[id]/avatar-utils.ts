import { authFetch } from "@/lib/auth/client";
import { clearMailboxesCache } from "@/components/mailbox-provider-utils";
import {
	PROFILE_AVATAR_ACCEPT,
	validateProfileAvatar,
} from "@/components/settings/profile-avatar-form-utils";
import type { MailboxAvatarUploadResponse } from "./types";

export const MAILBOX_AVATAR_ACCEPT = PROFILE_AVATAR_ACCEPT;

export function getMailboxAvatarUrl(mailboxId: string): string {
	return `/api/mailboxes/${mailboxId}/avatar?v=${Date.now()}`;
}

export function validateMailboxAvatar(file: File): string | null {
	return validateProfileAvatar(file);
}

export async function uploadMailboxAvatar(mailboxId: string, file: File): Promise<void> {
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

	const data = (await response.json().catch(() => null)) as MailboxAvatarUploadResponse | null;
	throw new Error(data?.error ?? "Upload failed");
}
