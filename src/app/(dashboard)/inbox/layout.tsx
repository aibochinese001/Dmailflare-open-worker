"use client";

import { inboxFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageSplitLayout } from "@/components/messages/message-split-layout";

export default function InboxLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MessageSplitLayout config={inboxFolderConfig}>
			{children}
		</MessageSplitLayout>
	);
}
