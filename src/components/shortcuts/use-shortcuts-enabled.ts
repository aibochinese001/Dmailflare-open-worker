"use client";

import { useCallback, useEffect, useState } from "react";
import { loadShortcutsEnabled, updateShortcutsEnabled } from "./use-shortcuts-enabled-utils";

/** Loads and updates the signed-in account's keyboard shortcut preference. */
export function useShortcutsEnabled() {
	const [enabled, setEnabledState] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadShortcutsEnabled()
			.then((storedEnabled) => {
				if (!cancelled) setEnabledState(storedEnabled);
			})
			.catch((loadError) => {
				if (cancelled) return;
				setEnabledState(true);
				setError(loadError instanceof Error ? loadError.message : "Failed to load shortcut settings");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const setEnabled = useCallback(async (next: boolean) => {
		const previous = enabled;
		setEnabledState(next);
		setError(null);
		try {
			setEnabledState(await updateShortcutsEnabled(next));
		} catch (updateError) {
			setEnabledState(previous);
			const message = updateError instanceof Error ? updateError.message : "Failed to update shortcut settings";
			setError(message);
			throw new Error(message);
		}
	}, [enabled]);

	return { enabled, error, isLoading, setEnabled };
}
