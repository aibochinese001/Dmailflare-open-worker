"use client";

import { CheckSquare2 } from "lucide-react";
import { useState } from "react";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import { BulkMessageToolbar } from "./bulk-message-toolbar";
import type { BulkMessageSelectionPaneProps } from "./types";
import { runBulkMessageAction } from "./utils";

export function BulkMessageSelectionPane({
	selectedMessages,
	onClearSelection,
}: BulkMessageSelectionPaneProps) {
	const [pending, setPending] = useState(false);
	const hasUnreadSelection = selectedMessages.some((message) => !message.read);

	async function runAction(action: BulkMessageAction) {
		if (selectedMessages.length === 0) return;

		setPending(true);
		try {
			await runBulkMessageAction(
				selectedMessages.map((message) => message.id),
				action,
			);
			onClearSelection();
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex h-full items-center justify-center p-8">
			<div className="w-full max-w-xl text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
					<CheckSquare2 className="h-6 w-6" />
				</div>
				<h2 className="mt-4 text-lg font-semibold text-neutral-900">
					{selectedMessages.length} selected
				</h2>
				<p className="mt-1 text-sm text-neutral-500">
					Choose an action to apply to the selected emails.
				</p>
				<div className="mt-5 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
					<BulkMessageToolbar
						selectedCount={selectedMessages.length}
						hasUnreadSelection={hasUnreadSelection}
						onAction={runAction}
						onClearSelection={onClearSelection}
						pending={pending}
						hideSelectedCount
					/>
				</div>
			</div>
		</div>
	);
}
