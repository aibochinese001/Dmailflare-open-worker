export interface AttachmentRouteParams {
	params: Promise<{
		attachmentId: string;
		messageId: string;
	}>;
}
