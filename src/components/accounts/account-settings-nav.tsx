"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	accountSettingsNavItems,
	getAccountSettingsHref,
	isActiveAccountSettingsPath,
} from "./account-settings-nav-utils";

export function AccountSettingsNav() {
	const { id } = useParams<{ id: string }>();
	const pathname = usePathname();

	return (
		<aside className="w-full shrink-0 lg:w-48">
			<div className="sticky top-6 space-y-3">
				<h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
					Account settings
				</h2>
				<nav className="space-y-1">
					{accountSettingsNavItems.map((item) => {
						const href = getAccountSettingsHref(id, item.segment);
						return (
							<Link
								key={item.segment || "details"}
								href={href}
								className={cn(
									"block rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
									isActiveAccountSettingsPath(pathname, href)
										? "bg-blue-100 text-blue-900"
										: "text-neutral-600 hover:bg-white/70 hover:text-neutral-900",
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
