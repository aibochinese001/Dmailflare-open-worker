import type { AccountSettingsNavItem } from "./account-settings-nav-types";

export const accountSettingsNavItems: AccountSettingsNavItem[] = [
	{ segment: "", label: "Details" },
	{ segment: "permissions", label: "Permissions" },
	{ segment: "mailboxes", label: "Mailboxes" },
];

export function getAccountSettingsHref(accountId: string, segment: AccountSettingsNavItem["segment"]): string {
	return `/accounts/${accountId}${segment ? `/${segment}` : ""}`;
}

export function isActiveAccountSettingsPath(pathname: string, href: string): boolean {
	return pathname === href;
}
