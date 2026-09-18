import type { UnsubscribeUrl } from "@/lib/email/unsubscribe-types";

const maxHeaderBytes = 64 * 1024;
const allowedUnsubscribeProtocols = new Set(["http:", "https:", "mailto:"]);

function getHeaderBlock(raw: ArrayBuffer): string {
	const slice = raw.slice(0, Math.min(raw.byteLength, maxHeaderBytes));
	const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
	const headerEnd = text.search(/\r?\n\r?\n/);
	return headerEnd === -1 ? text : text.slice(0, headerEnd);
}

function parseHeaders(headerBlock: string): Map<string, string[]> {
	const headers = new Map<string, string[]>();
	let currentName: string | null = null;

	for (const line of headerBlock.split(/\r?\n/)) {
		if (/^[\t ]/.test(line) && currentName) {
			const values = headers.get(currentName);
			if (values?.length) values[values.length - 1] += ` ${line.trim()}`;
			continue;
		}

		const separator = line.indexOf(":");
		if (separator <= 0) {
			currentName = null;
			continue;
		}

		currentName = line.slice(0, separator).trim().toLowerCase();
		const value = line.slice(separator + 1).trim();
		headers.set(currentName, [...(headers.get(currentName) ?? []), value]);
	}

	return headers;
}

function normalizeCandidate(value: string): string {
	return value.trim().replace(/^<|>$/g, "").replace(/^"|"$/g, "");
}

function isAllowedUnsubscribeUrl(value: string): boolean {
	try {
		return allowedUnsubscribeProtocols.has(new URL(value).protocol);
	} catch {
		return false;
	}
}

function getCandidates(value: string): string[] {
	const bracketed = [...value.matchAll(/<([^>]+)>/g)].map((match) => normalizeCandidate(match[1] ?? ""));
	const bare = value.split(",").map(normalizeCandidate);
	return [...bracketed, ...bare].filter(Boolean);
}

export function extractUnsubscribeUrlFromRaw(raw: ArrayBuffer): UnsubscribeUrl {
	const headers = parseHeaders(getHeaderBlock(raw));
	const values = headers.get("list-unsubscribe") ?? [];
	const candidates = values.flatMap(getCandidates).filter(isAllowedUnsubscribeUrl);
	return candidates.find((candidate) => candidate.startsWith("https://") || candidate.startsWith("http://"))
		?? candidates.find((candidate) => candidate.startsWith("mailto:"))
		?? null;
}

export async function getUnsubscribeUrlFromRawR2Key(env: CloudflareEnv, rawR2Key: string | null): Promise<UnsubscribeUrl> {
	if (!rawR2Key) return null;
	const raw = await env.BUCKET.get(rawR2Key, { range: { offset: 0, length: maxHeaderBytes } });
	if (!raw) return null;
	return extractUnsubscribeUrlFromRaw(await raw.arrayBuffer());
}
