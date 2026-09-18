"use client";

import { MessageFolderPage } from "@/components/messages/message-folder-page";
import { starredFolderConfig } from "@/components/messages/message-folder-configs";

export default function StarredPage() {
	return <MessageFolderPage config={starredFolderConfig} />;
}
