"use client";

import { MessageFolderPage } from "@/components/messages/message-folder-page";
import { snoozedFolderConfig } from "@/components/messages/message-folder-configs";

export default function SnoozedPage() {
	return <MessageFolderPage config={snoozedFolderConfig} />;
}
