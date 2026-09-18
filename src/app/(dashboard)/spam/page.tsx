"use client";

import { spamFolderConfig } from "@/components/messages/message-folder-configs";
import { MessageFolderPage } from "@/components/messages/message-folder-page";

export default function SpamPage() {
	return <MessageFolderPage config={spamFolderConfig} />;
}
