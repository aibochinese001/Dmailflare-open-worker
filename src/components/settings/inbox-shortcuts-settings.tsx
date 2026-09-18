"use client";

import { useState } from "react";
import { useShortcuts } from "@/components/shortcuts";
import { Switch } from "@/components/ui/switch";

export function InboxShortcutsSettings() {
	const {
		shortcutsEnabled,
		shortcutsPreferenceLoading,
		shortcutsPreferenceError,
		setShortcutsEnabled,
	} = useShortcuts();
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	return (
		<div>
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">Keyboard shortcuts</span>
					<span className="mt-1 block text-sm text-neutral-500">
						Use quick keys to navigate, compose, and manage messages on this account.
					</span>
				</span>
				<Switch
					checked={shortcutsEnabled}
					disabled={shortcutsPreferenceLoading || saving}
					onCheckedChange={(enabled) => {
						setSaving(true);
						setSaveError(null);
						void setShortcutsEnabled(enabled)
							.catch((error) => setSaveError(error instanceof Error ? error.message : "Failed to update shortcut settings"))
							.finally(() => setSaving(false));
					}}
					aria-label="Enable keyboard shortcuts"
				/>
			</label>
			{(saveError || shortcutsPreferenceError) && (
				<p className="mt-2 px-4 text-sm text-red-600">{saveError || shortcutsPreferenceError}</p>
			)}
		</div>
	);
}
