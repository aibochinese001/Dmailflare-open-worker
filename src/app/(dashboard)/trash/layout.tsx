"use client";

import { trashFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageSplitLayout } from "@/components/messages/message-split-layout";

export default function TrashLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MessageSplitLayout config={trashFolderConfig}>
			{children}
		</MessageSplitLayout>
	);
}
