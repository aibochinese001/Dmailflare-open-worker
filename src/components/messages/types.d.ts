import type { LucideIcon } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Message, MessageFolder } from "@/hooks/types";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";

export type MessageFolderConfig = {
	folder: MessageFolder;
	title: string;
	emptyText: string;
	hrefPrefix: string;
	folderId?: string;
	icon: LucideIcon;
	headerIcons?: LucideIcon[];
	badgeVariant?: "default" | "secondary" | "outline";
	showRowBadge?: boolean;
};

export type MessageListRowProps = {
	message: Message;
	config: MessageFolderConfig;
	selected: boolean;
	active?: boolean;
	compact?: boolean;
	currentAccountName?: string;
	onSelectedChange: (messageId: string, selected: boolean) => void;
	onMessageAction: (messageId: string, action: RowMessageAction) => Promise<void>;
	dragMessageIds: string[];
};

export type RowMessageAction = "archive" | "trash" | "read" | "unread";

export type MessageListRowActionsProps = {
	message: Message;
	onAction: (action: RowMessageAction) => Promise<void>;
};

export type MessageFolderPageProps = {
	config: MessageFolderConfig;
	compact?: boolean;
	selectedMessageId?: string;
	selection?: MessageSelectionControl;
};

export type MessageSplitLayoutProps = {
	children: ReactNode;
	config: MessageFolderConfig;
};

export type BulkMessageToolbarProps = {
	selectedCount: number;
	hasUnreadSelection: boolean;
	hideSelectedCount?: boolean;
	onAction: (action: BulkMessageAction) => void;
	onClearSelection: () => void;
	pending: boolean;
};

export type SelectedMessage = Pick<Message, "id" | "read">;

export type MessageSelectionControl = {
	selectedMessages: SelectedMessage[];
	setSelectedMessages: Dispatch<SetStateAction<SelectedMessage[]>>;
};

export type BulkMessageSelectionPaneProps = {
	selectedMessages: SelectedMessage[];
	onClearSelection: () => void;
};

export type PageRange = {
	start: number;
	end: number;
	total: number;
};

export type EmailPageTitleInput = {
	location: string;
	total: number;
	unread: number;
	emailAddress: string | null;
};
