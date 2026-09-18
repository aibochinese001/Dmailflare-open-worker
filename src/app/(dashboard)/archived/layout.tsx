"use client";

import { archivedFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageSplitLayout } from "@/components/messages/message-split-layout";

export default function ArchivedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MessageSplitLayout config={archivedFolderConfig}>
			{children}
		</MessageSplitLayout>
	);
}
