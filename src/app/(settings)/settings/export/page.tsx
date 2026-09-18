"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import type { ExportState } from "./types";
import { exportMailbox } from "./utils";

export default function SettingsExportPage() {
	const { selectedMailbox } = useSelectedMailbox();
	const [exportState, setExportState] = useState<ExportState>({ error: null, loading: false });

	async function onExport() {
		if (!selectedMailbox?.id) return;
		setExportState({ error: null, loading: true });
		try {
			await exportMailbox(selectedMailbox.id, `${selectedMailbox.localPart}.mbox`);
		} catch (error) {
			setExportState({ error: error instanceof Error ? error.message : "Export failed", loading: false });
			return;
		}
		setExportState({ error: null, loading: false });
	}

	return (
		<div className="space-y-6">
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Export mailbox</h2>
					<p className="mt-1 text-sm text-neutral-500">
						Download message headers and bodies from the selected mailbox as an .mbox file.
						Attachments are not included in this export.
					</p>
				</div>
				<div className="space-y-3 rounded-3xl bg-white p-6">
					<Button type="button" variant="outline" disabled={!selectedMailbox || exportState.loading} onClick={onExport}>
						{exportState.loading ? "Preparing..." : "Download .mbox"}
					</Button>
					{exportState.error && (
						<p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
							{exportState.error}
						</p>
					)}
				</div>
			</section>
		</div>
	);
}
