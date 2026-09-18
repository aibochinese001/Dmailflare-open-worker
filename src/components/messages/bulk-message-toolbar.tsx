"use client";

import { Archive, Mail, MailOpen, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { BulkMessageToolbarProps } from "./types";

export function BulkMessageToolbar({
	selectedCount,
	hasUnreadSelection,
	hideSelectedCount = false,
	onAction,
	onClearSelection,
	pending,
}: BulkMessageToolbarProps) {
	return (
		<div className="flex min-w-0 items-center gap-2 text-neutral-600 w-full">
			{!hideSelectedCount && (
				<span className="mr-2 text-sm font-medium text-neutral-800">
					{selectedCount} selected
				</span>
			)}
			<Tooltip label="Archive">
				<Button variant="ghost" size="sm" onClick={() => onAction("archive")} disabled={pending} aria-label="Archive">
					<Archive className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label="Report spam">
				<Button variant="ghost" size="sm" onClick={() => onAction("spam")} disabled={pending} aria-label="Report spam">
					<ShieldAlert className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label="Delete">
				<Button variant="ghost" size="sm" onClick={() => onAction("trash")} disabled={pending} aria-label="Delete">
					<Trash2 className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label={hasUnreadSelection ? "Mark as read" : "Mark as unread"}>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onAction(hasUnreadSelection ? "read" : "unread")}
					disabled={pending}
					aria-label={hasUnreadSelection ? "Mark as read" : "Mark as unread"}
				>
					{hasUnreadSelection ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
				</Button>
			</Tooltip>
			<span className="flex-1" />
			<Tooltip label="Move selected messages">
					<Select
						className="bg-white text-xs font-medium py-2 text-neutral-700 outline-none"
						disabled={pending}
						defaultValue=""
						aria-label="Move selected messages"
						onChange={(event) => {
							if (!event.target.value) return;
							onAction(event.target.value as BulkMessageAction);
							event.target.value = "";
						}}
					>
						<option value="">Move to</option>
						<option value="archive">Archived</option>
						<option value="spam">Spam</option>
						<option value="trash">Trash</option>
					</Select>
			</Tooltip>
			<Tooltip label="Clear selection">
				<Button variant="ghost" size="sm" onClick={onClearSelection} disabled={pending} aria-label="Clear selection">
					<X className="h-4 w-4" />
				</Button>
			</Tooltip>
		</div>
	);
}
