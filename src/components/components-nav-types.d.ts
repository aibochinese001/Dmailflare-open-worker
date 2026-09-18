import type { LucideIcon } from "lucide-react";

export type NavLink = {
	href?: string;
	label?: string;
	icon?: LucideIcon;
	iconColor?: string;
	primary?: boolean;
	preloadMessages?: boolean;
	count?: number;
	onMessageDrop?: (messageIds: string[]) => void;
};
