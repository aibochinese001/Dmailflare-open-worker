export interface CloudAttachment {
	filename: string;
	id: string;
	provider: "OneDrive";
	url: string;
}

export interface CloudAttachmentExtraction {
	attachments: CloudAttachment[];
	content: string;
}
