import { getMessageQueryParams, fetchMessageList } from "@/hooks/utils";
import type { MessageFolder } from "@/hooks/types";

export async function preloadMailboxPage(href: string, mailboxId?: string) {
	const customFolderMatch = href.match(/^\/folders\/([^/]+)$/);
	const folder = (customFolderMatch ? "inbox" : href.slice(1)) as MessageFolder;
	const supportedFolders: MessageFolder[] = ["inbox", "starred", "snoozed", "sent", "drafts", "archived", "spam", "trash"];
	if (!supportedFolders.includes(folder)) return;

	const params = getMessageQueryParams(
		folder,
		mailboxId,
		{ limit: 25, offset: 0 },
		customFolderMatch?.[1],
	);
	await fetchMessageList(params);
}

export function waitForNavigationProgress(duration = 350) {
	return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}
