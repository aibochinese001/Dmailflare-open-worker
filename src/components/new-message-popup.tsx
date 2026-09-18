"use client";

import Link from "next/link";
import { Mail, X } from "lucide-react";
import { getEmailDisplayName } from "@/lib/email/address";
import type { NewMessagePopupProps } from "./new-message-popup-types";

export function NewMessagePopup({
	notification,
	onDismiss,
}: NewMessagePopupProps) {
	return (
		<div className="fixed right-5 top-5 z-[100] w-[min(380px,calc(100vw-40px))] rounded-xl border border-blue-200 bg-white p-4 shadow-xl">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
					<Mail className="h-5 w-5" />
				</div>
				<Link
					href={`/inbox/${notification.messageId}`}
					onClick={onDismiss}
					className="min-w-0 flex-1"
				>
					<p className="text-sm font-semibold text-neutral-900">
						New email
					</p>
					<p className="mt-0.5 truncate text-sm text-neutral-800">
						{notification.subject || "(no subject)"}
					</p>
					<p className="mt-1 truncate text-xs text-neutral-500">
						From {notification.fromName ?? getEmailDisplayName(notification.from)}
					</p>
				</Link>
				<button
					type="button"
					onClick={onDismiss}
					className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Dismiss notification</span>
				</button>
			</div>
		</div>
	);
}
