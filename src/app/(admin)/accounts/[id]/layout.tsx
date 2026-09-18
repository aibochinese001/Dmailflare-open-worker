import type { ReactNode } from "react";
import { AccountSettingsNav } from "@/components/accounts/account-settings-nav";

export default function AccountSettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-8 lg:flex-row">
			<div className="min-w-0 flex-1">{children}</div>
			<AccountSettingsNav />
		</div>
	);
}
