export function getAttachmentContentDisposition(filename: string, inline: boolean): string {
	const safeFilename = filename.replace(/["\\\r\n]/g, "_");
	return `${inline ? "inline" : "attachment"}; filename="${safeFilename}"`;
}

export function isPreviewableAttachmentType(contentType: string): boolean {
	return (
		contentType === "application/pdf" ||
		contentType.startsWith("audio/") ||
		contentType.startsWith("video/") ||
		(contentType.startsWith("image/") && contentType !== "image/svg+xml") ||
		contentType.startsWith("text/plain") ||
		contentType === "application/json" ||
		contentType === "application/xml" ||
		contentType === "text/csv"
	);
}
