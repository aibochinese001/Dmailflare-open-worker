import type { DnsRecord } from "./types";

export function getDnsRecordLabel(record: DnsRecord): string {
	const recordName = record.name || "Domain";
	const destination = record.content ? ` → ${record.content}` : "";
	const priority = record.priority === undefined ? "" : ` (priority ${record.priority})`;
	return `${record.type || "DNS"} · ${recordName}${destination}${priority}`;
}
