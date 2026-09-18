import type { UploadedBrandingIcon } from "./types";

export const MAX_BRANDING_ICON_SIZE = 2 * 1024 * 1024;
export const BRANDING_ICON_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isBrandingIcon(value: FormDataEntryValue | null): value is UploadedBrandingIcon {
	return value !== null && typeof value !== "string" && typeof value.arrayBuffer === "function";
}
