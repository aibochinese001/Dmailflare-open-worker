export function quoteImapString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function parseSearchUids(line: string): string[] {
	const match = line.match(/^\* SEARCH(?:\s+(.+))?$/i);
	if (!match?.[1]) return [];
	return match[1].trim().split(/\s+/).filter((value) => /^\d+$/.test(value));
}

export function getLiteralLength(line: string): number | null {
	const match = line.match(/\{(\d+)\}$/);
	return match ? Number(match[1]) : null;
}

export function isTaggedCompletion(line: string, tag: string): boolean {
	return line.toUpperCase().startsWith(`${tag.toUpperCase()} `);
}

export function parseListMailboxName(line: string): string | null {
	const match = line.match(/^\* LIST\s+\([^\)]*\)\s+(?:"[^"]*"|NIL)\s+(.+)$/i);
	if (!match?.[1]) return null;
	const value = match[1].trim();
	if (value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	return value || null;
}

export function assertSafeImapHost(host: string): void {
	const value = host.trim().toLowerCase();
	if (!value || value === "localhost" || value.endsWith(".local")) {
		throw new Error("IMAP host is not allowed");
	}
	if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) {
		const parts = value.split(".").map(Number);
		if (
			parts[0] === 10 ||
			parts[0] === 127 ||
			(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
			(parts[0] === 192 && parts[1] === 168) ||
			(parts[0] === 169 && parts[1] === 254)
		) {
			throw new Error("Private IMAP hosts are not allowed");
		}
	}
}
