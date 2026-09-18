import { authFetch } from "@/lib/auth/client";
import type {
	DomainRule,
	DomainRuleField,
	DomainRuleInput,
	DomainRuleMailbox,
	DomainRuleOperator,
} from "./types";

export const MATCH_FIELD_LABELS: Record<DomainRuleField, string> = {
	recipient: "Recipient address",
	sender: "Sender address",
	title: "Subject",
	content: "Body",
};

export const MATCH_OPERATOR_LABELS: Record<DomainRuleOperator, string> = {
	contains: "contains",
	exact: "is exactly",
	starts_with: "starts with",
	ends_with: "ends with",
	regex: "matches regex",
};

export const ACTION_LABELS = {
	store: "Deliver to mailbox",
	forward: "Forward to address",
	reject: "Reject / block",
} as const;

async function readJson<T>(res: Response): Promise<T> {
	const json = (await res.json()) as T & { error?: unknown };
	if (!res.ok) {
		throw new Error(typeof json.error === "string" ? json.error : "Request failed");
	}
	return json;
}

export async function fetchDomainRules(
	domainId: string,
	mailboxId?: string,
): Promise<{ rules: DomainRule[]; mailboxes: DomainRuleMailbox[] }> {
	const params = new URLSearchParams({ domainId });
	if (mailboxId) params.set("mailboxId", mailboxId);
	const res = await authFetch(`/api/routing-rules/domain?${params}`);
	const json = await readJson<{ rules: DomainRule[]; mailboxes: DomainRuleMailbox[] }>(res);
	return { rules: json.rules ?? [], mailboxes: json.mailboxes ?? [] };
}


function domainRuleUrl(id: string | null, mailboxId?: string): string {
	const params = new URLSearchParams();
	if (mailboxId) params.set("mailboxId", mailboxId);
	const queryString = params.toString();
	const query = queryString ? `?${queryString}` : "";
	return `/api/routing-rules/domain${id ? `/${id}` : ""}${query}`;
}

export async function createDomainRule(input: DomainRuleInput, mailboxId?: string) {
	return readJson(
		await authFetch(domainRuleUrl(null, mailboxId), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
}

export async function updateDomainRule(id: string, input: DomainRuleInput, mailboxId?: string) {
	return readJson(
		await authFetch(domainRuleUrl(id, mailboxId), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
}

export async function deleteDomainRule(id: string, mailboxId?: string) {
	return readJson(await authFetch(domainRuleUrl(id, mailboxId), { method: "DELETE" }));
}

export function describeRule(rule: DomainRule, mailboxes: DomainRuleMailbox[], hostname: string): string {
	const condition =
		rule.matchValue === "*"
			? "Any message"
			: `${MATCH_FIELD_LABELS[rule.matchField]} ${MATCH_OPERATOR_LABELS[rule.matchOperator]} "${rule.matchValue}"`;

	if (rule.action === "reject") return `${condition} → reject`;
	if (rule.action === "forward") {
		const copy = rule.keepCopy ? " and keep a copy" : "";
		return `${condition} → forward to ${rule.forwardTo ?? "—"}${copy}`;
	}
	const mailbox = mailboxes.find((m) => m.id === rule.mailboxId);
	const address = mailbox ? `${mailbox.localPart}@${hostname}` : "—";
	return `${condition} → deliver to ${address}`;
}

export function formatLastMatched(value: DomainRule["lastMatchedAt"]): string {
	if (value === null || value === undefined) return "Never";
	const numeric = typeof value === "number" ? value : Date.parse(String(value));
	if (!Number.isFinite(numeric)) return "Never";
	// Drizzle timestamps serialise as seconds when they bypass the mapper.
	const ms = numeric < 1e12 ? numeric * 1000 : numeric;
	return new Date(ms).toLocaleString();
}

export function emptyRuleInput(domainId: string): DomainRuleInput {
	return {
		domainId,
		name: "",
		enabled: true,
		matchField: "recipient",
		matchOperator: "contains",
		matchValue: "",
		action: "store",
		mailboxId: null,
		forwardTo: "",
		keepCopy: false,
		rejectReason: "",
		priority: 100,
	};
}

export function ruleToInput(rule: DomainRule): DomainRuleInput {
	return {
		domainId: rule.domainId,
		name: rule.name ?? "",
		enabled: rule.enabled,
		matchField: rule.matchField,
		matchOperator: rule.matchOperator,
		matchValue: rule.matchValue,
		action: rule.action,
		mailboxId: rule.mailboxId,
		forwardTo: rule.forwardTo ?? "",
		keepCopy: rule.keepCopy,
		rejectReason: rule.rejectReason ?? "",
		priority: rule.priority,
	};
}
