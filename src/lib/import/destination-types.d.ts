export type ImportSystemSection = "inbox" | "sent" | "drafts" | "archived" | "spam" | "trash";

export type ImportDestination =
	| {
			type: "system";
			section: ImportSystemSection;
	  }
	| {
			type: "folder";
			folderId: string;
	  };

export type ImportMessagePlacement = {
	direction: "inbound" | "outbound";
	status: string;
	folderId: string | null;
};
