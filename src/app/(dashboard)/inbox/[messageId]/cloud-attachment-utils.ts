import type {
	CloudAttachment,
	CloudAttachmentExtraction,
} from "./cloud-attachment-types";

const ZERO_WIDTH_RE = /[\u200B-\u200D\u2060\uFEFF]/g;
const OUTLOOK_CLOUD_ATTACHMENT_RE =
	/^\s*\[(https?:\/\/[^\]\s]+)\]([^<\r\n]+)<(https?:\/\/[^>\s]+)>\s*$/gm;

function isMicrosoftCloudFileUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname.toLowerCase();
		return (
			hostname === "1drv.ms" ||
			hostname === "onedrive.live.com" ||
			hostname.endsWith(".sharepoint.com")
		);
	} catch {
		return false;
	}
}

export function extractCloudAttachments(content: string): CloudAttachmentExtraction {
	const normalized = content.replace(ZERO_WIDTH_RE, "");
	const attachments: CloudAttachment[] = [];

	const body = normalized.replace(
		OUTLOOK_CLOUD_ATTACHMENT_RE,
		(fullMatch, _iconUrl: string, rawFilename: string, fileUrl: string) => {
			if (!isMicrosoftCloudFileUrl(fileUrl)) return fullMatch;

			const filename = rawFilename.trim();
			if (!filename) return fullMatch;

			attachments.push({
				id: `${fileUrl}-${attachments.length}`,
				filename,
				provider: "OneDrive",
				url: fileUrl,
			});
			return "";
		},
	);

	return {
		attachments,
		content: body.replace(/\n{3,}/g, "\n\n").trim(),
	};
}
