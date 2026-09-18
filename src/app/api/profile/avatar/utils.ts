import type { UploadedAvatarFile } from "./types";

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function avatarKeyFor(userId: string): string {
	return `avatars/${userId}`;
}

export function isUploadedAvatarFile(value: FormDataEntryValue | null): value is UploadedAvatarFile {
	return (
		value !== null &&
		typeof value !== "string" &&
		typeof value.arrayBuffer === "function" &&
		typeof value.size === "number" &&
		typeof value.type === "string"
	);
}
