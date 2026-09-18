"use client";

import { useSidebar } from "./sidebar-state";
import { useShortcuts } from "./shortcuts";
import { Keyboard } from "lucide-react";
import { LanguageToggle } from "./language-toggle";

export function SidebarFooter() {
	const { minimal } = useSidebar();
	const { openHelpModal, shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();
	if (minimal) return null;

  return (
    <div className="px-3 pt-3 flex flex-col gap-2">
      {shortcutsEnabled && !shortcutsPreferenceLoading && (
        <button
          type="button"
          onClick={openHelpModal}
          className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
            Shortcuts
          </span>
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-neutral-200 rounded text-neutral-500 shadow-2xs">
            ?
          </kbd>
        </button>
      )}
      <LanguageToggle />
      <p className="px-1 text-[11px]">
        Powered by{" "}
        <a
          href="https://opcgrow.org"
          target="_blank"
          className="font-bold text-black hover:underline"
          rel="noreferrer"
        >
          OPCgrow
        </a>
      </p>
    </div>
  );
}
