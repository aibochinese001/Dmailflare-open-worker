import { authFetch } from "@/lib/auth/client";

export async function exportMailbox(mailboxId: string, filename: string): Promise<void> {
	const params = new URLSearchParams({ mailboxId });
	const response = await authFetch(`/api/export/messages?${params.toString()}`);
	if (!response.ok) {
		const data = (await response.json()) as { error?: string };
		throw new Error(data.error ?? "Export failed");
	}

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
