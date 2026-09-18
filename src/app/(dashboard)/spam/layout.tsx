"use client";

import { spamFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageSplitLayout } from "@/components/messages/message-split-layout";

export default function SpamLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MessageSplitLayout config={spamFolderConfig}>
			{children}
		</MessageSplitLayout>
	);
}
