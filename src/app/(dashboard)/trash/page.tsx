"use client";

import { trashFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageFolderPage } from "@/components/messages/message-folder-page";

export default function TrashPage() {
	return <MessageFolderPage config={trashFolderConfig} />;
}
