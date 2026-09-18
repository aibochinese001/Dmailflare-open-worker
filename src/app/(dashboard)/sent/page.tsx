"use client";

import { sentFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageFolderPage } from "@/components/messages/message-folder-page";

export default function SentPage() {
	return <MessageFolderPage config={sentFolderConfig} />;
}
