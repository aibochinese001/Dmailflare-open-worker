import type { ImportDestination, ImportMessagePlacement, ImportSystemSection } from "./destination-types";

const systemSections = new Set<ImportSystemSection>(["inbox", "sent", "drafts", "archived", "spam", "trash"]);

export const DEFAULT_IMPORT_DESTINATION = "system:inbox";

export function parseImportDestination(value: unknown): ImportDestination {
	const destination = typeof value === "string" && value.trim() ? value.trim() : DEFAULT_IMPORT_DESTINATION;
	if (destination.startsWith("folder:")) {
		const folderId = destination.slice("folder:".length).trim();
		if (!folderId) throw new Error("Import folder is required");
		return { type: "folder", folderId };
	}

	const section = destination.startsWith("system:")
		? destination.slice("system:".length)
		: destination;
	if (systemSections.has(section as ImportSystemSection)) {
		return { type: "system", section: section as ImportSystemSection };
	}

	throw new Error("Import destination is invalid");
}

export function getImportMessagePlacement(destination: ImportDestination): ImportMessagePlacement {
	if (destination.type === "folder") {
		return { direction: "inbound", status: "received", folderId: destination.folderId };
	}

	if (destination.section === "sent") {
		return { direction: "outbound", status: "sent", folderId: null };
	}

	if (destination.section === "drafts") {
		return { direction: "outbound", status: "draft", folderId: null };
	}

	if (destination.section === "archived") {
		return { direction: "inbound", status: "archived", folderId: null };
	}

	if (destination.section === "spam" || destination.section === "trash") {
		return { direction: "inbound", status: destination.section, folderId: null };
	}

	return { direction: "inbound", status: "received", folderId: null };
}

export function getImportMessageUserId(
	destination: ImportDestination,
	currentUserId: string,
	mailboxUserId: string,
): string {
	if (destination.type === "system" && (destination.section === "sent" || destination.section === "drafts")) {
		return currentUserId;
	}
	return mailboxUserId;
}
