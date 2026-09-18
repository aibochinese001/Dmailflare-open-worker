import { authFetch } from "@/lib/auth/client";

export const CONTACT_AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const maxContactAvatarSize = 2 * 1024 * 1024;

export function validateContactAvatar(file: File): string | null {
	if (!CONTACT_AVATAR_ACCEPT.split(",").includes(file.type)) {
		return "Use a JPEG, PNG, WebP, or GIF image";
	}
	if (file.size > maxContactAvatarSize) return "Image must be 2 MB or smaller";
	return null;
}

export async function uploadContactAvatar(mailboxId: string, address: string, file: File): Promise<void> {
	const body = new FormData();
	body.append("mailboxId", mailboxId);
	body.append("address", address);
	body.append("file", file, file.name);
	const response = await authFetch("/api/contacts/avatar", { method: "POST", body });
	if (response.ok) return;
	const data = (await response.json().catch(() => null)) as { error?: string } | null;
	throw new Error(data?.error ?? "Upload failed");
}

export async function removeContactAvatar(mailboxId: string, address: string): Promise<void> {
	const params = new URLSearchParams({ mailboxId, address });
	const response = await authFetch(`/api/contacts/avatar?${params.toString()}`, { method: "DELETE" });
	if (response.ok) return;
	const data = (await response.json().catch(() => null)) as { error?: string } | null;
	throw new Error(data?.error ?? "Unable to remove profile picture");
}
