"use client";

import { inboxFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageFolderPage } from "@/components/messages/message-folder-page";

export default function InboxPage() {
	return <MessageFolderPage config={inboxFolderConfig} />;
}
