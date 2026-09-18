"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { getLang, setLang, type Lang } from "@/lib/i18n/runtime";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
	const [lang] = useState<Lang>(() => getLang());

	return (
		<button
			type="button"
			onClick={() => setLang(lang === "zh" ? "en" : "zh")}
			className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-lg transition-colors"
			title={lang === "zh" ? "Switch to English" : "切换为中文"}
		>
			<span className="flex items-center gap-1.5">
				<Languages className="w-3.5 h-3.5 text-neutral-400" />
				{lang === "zh" ? "English" : "中文"}
			</span>
			{!compact && (
				<kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-neutral-200 rounded text-neutral-500 shadow-2xs">
					{lang === "zh" ? "EN" : "中"}
				</kbd>
			)}
		</button>
	);
}
