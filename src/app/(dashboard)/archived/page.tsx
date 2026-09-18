"use client";

import { archivedFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageFolderPage } from "@/components/messages/message-folder-page";

export default function ArchivedPage() {
	return <MessageFolderPage config={archivedFolderConfig} />;
}
