"use client";

import { MessageSplitLayout } from "@/components/messages/message-split-layout";
import { starredFolderConfig } from "@/components/messages/message-folder-configs";

export default function StarredLayout({ children }: { children: React.ReactNode }) {
	return <MessageSplitLayout config={starredFolderConfig}>{children}</MessageSplitLayout>;
}
