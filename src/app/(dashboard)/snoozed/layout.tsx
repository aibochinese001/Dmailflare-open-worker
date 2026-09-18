"use client";

import { MessageSplitLayout } from "@/components/messages/message-split-layout";
import { snoozedFolderConfig } from "@/components/messages/message-folder-configs";

export default function SnoozedLayout({ children }: { children: React.ReactNode }) {
	return <MessageSplitLayout config={snoozedFolderConfig}>{children}</MessageSplitLayout>;
}
