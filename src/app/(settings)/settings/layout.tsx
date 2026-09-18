import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-row gap-4 min-h-[calc(100dvh-4rem)] bg-inherit">
			<div className="min-w-0 flex-1 pt-4">
				<div className="mx-auto w-full max-w-3xl">{children}</div>
			</div>
			<SettingsNav />
		</div>
	);
}
