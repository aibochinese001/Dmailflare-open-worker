import type { ContactAvatarChangedDetail } from "./avatar-client-types";

export const CONTACT_AVATAR_CHANGED_EVENT = "mailflare:contact-avatar-changed";

export function dispatchContactAvatarChanged(detail: ContactAvatarChangedDetail) {
	window.dispatchEvent(new CustomEvent(CONTACT_AVATAR_CHANGED_EVENT, { detail }));
}
