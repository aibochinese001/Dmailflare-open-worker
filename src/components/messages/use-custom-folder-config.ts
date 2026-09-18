"use client";

import { Folder } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { authFetch } from "@/lib/auth/client";
import type { CustomFolderSummary } from "./custom-folder-config-types";
import type { MessageFolderConfig } from "./types";

export function useCustomFolderConfig(folderId: string): MessageFolderConfig {
	const { selectedMailbox } = useSelectedMailbox();
	const [folderName, setFolderName] = useState("Folder");

	useEffect(() => {
		if (!selectedMailbox?.id) return;
		let cancelled = false;
		const search = new URLSearchParams({ mailboxId: selectedMailbox.id });

		authFetch(`/api/folders?${search.toString()}`)
			.then((response) => response.json() as Promise<{ folders?: CustomFolderSummary[] }>)
			.then((data) => {
				if (cancelled) return;
				const folder = data.folders?.find((item) => item.id === folderId);
				if (folder) setFolderName(folder.name);
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [folderId, selectedMailbox?.id]);

	return useMemo(
		() => ({
			folder: "inbox",
			folderId,
			title: folderName,
			emptyText: "No emails in this folder",
			hrefPrefix: `/folders/${folderId}`,
			icon: Folder,
			showRowBadge: false,
		}),
		[folderId, folderName],
	);
}
