"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useBranding } from "./branding-provider";
import { useSidebar } from "./sidebar-state";
import type { SidebarHeaderProps } from "./sidebar-state-types";

export function SidebarHeader({ href, label }: SidebarHeaderProps) {
	const branding = useBranding();
	const { minimal, toggle } = useSidebar();
	return (
		<div className={`mb-3 flex h-10 items-center ${minimal ? "justify-center" : "gap-2 px-1"}`}>
			<button type="button" onClick={toggle} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200" aria-label={minimal ? "Expand menu" : "Collapse menu"}>
				{minimal ? <img src={branding.iconUrl} height={28} width={28} alt="" /> : <Menu className="h-5 w-5" />}
			</button>
			{!minimal && <Link href={href} className="flex min-w-0 items-center gap-3"><img src={branding.iconUrl} height={28} width={28} alt="" /><span className="truncate text-lg font-semibold text-neutral-800">{label ?? branding.appName}</span></Link>}
		</div>
	);
}
