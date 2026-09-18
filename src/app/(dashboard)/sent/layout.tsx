"use client";

import { sentFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageSplitLayout } from "@/components/messages/message-split-layout";

export default function SentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MessageSplitLayout config={sentFolderConfig}>
			{children}
		</MessageSplitLayout>
	);
}
