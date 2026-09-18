import { and, asc, desc, eq, exists, gt, gte, inArray, isNull, like, lt, ne, not, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { messageAttachments, messages } from "@/db/schema";
import { KEYWORD_DRAFT, KEYWORD_FLAGGED, KEYWORD_SEEN } from "./constants";
import { invalidArguments } from "./errors";
import { decodeMailboxRef, roleToStatus } from "./ids";
import type { Comparator, Filter, FilterCondition, MailboxRef } from "./types";

/** The SQL predicate for "is in this JMAP Mailbox". */
export function mailboxRefCondition(ref: MailboxRef): SQL {
	const base = eq(messages.mailboxId, ref.mailboxId);
	if (ref.kind === "account") return base;
	if (ref.kind === "folder") return and(base, eq(messages.folderId, ref.folderId))!;
	const status = roleToStatus(ref.role);
	if (ref.role === "inbox") return and(base, eq(messages.status, status), isNull(messages.folderId))!;
	if (ref.role === "sent") return and(base, inArray(messages.status, ["sent", "queued", "failed"]), isNull(messages.folderId))!;
	return and(base, eq(messages.status, status), isNull(messages.folderId))!;
}

function keywordCondition(keyword: string, present: boolean): SQL {
	switch (keyword) {
		case KEYWORD_SEEN:
			return present ? or(eq(messages.read, true), eq(messages.direction, "outbound"))! : and(eq(messages.read, false), eq(messages.direction, "inbound"))!;
		case KEYWORD_FLAGGED:
			return eq(messages.starred, present);
		case KEYWORD_DRAFT:
			return present ? eq(messages.status, "draft") : ne(messages.status, "draft");
		default:
			// Unknown keywords are never set, so "has" matches nothing and "not" matches all.
			return present ? sql`0` : sql`1`;
	}
}

function likePattern(value: string): string {
	return `%${value.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
}

function conditionToSql(condition: FilterCondition, accessible: Set<string>): SQL[] {
	const parts: SQL[] = [];
	if (condition.inMailbox !== undefined) {
		const ref = decodeMailboxRef(condition.inMailbox);
		if (!ref || !accessible.has(ref.mailboxId)) throw invalidArguments(`Unknown mailbox ${condition.inMailbox}`);
		parts.push(mailboxRefCondition(ref));
	}
	if (condition.inMailboxOtherThan) {
		for (const id of condition.inMailboxOtherThan) {
			const ref = decodeMailboxRef(id);
			if (ref && accessible.has(ref.mailboxId)) parts.push(not(mailboxRefCondition(ref)));
		}
	}
	if (condition.before) parts.push(lt(messages.createdAt, new Date(condition.before)));
	if (condition.after) parts.push(gte(messages.createdAt, new Date(condition.after)));
	if (condition.hasKeyword) parts.push(keywordCondition(condition.hasKeyword, true));
	if (condition.notKeyword) parts.push(keywordCondition(condition.notKeyword, false));
	if (condition.someInThreadHaveKeyword) parts.push(keywordCondition(condition.someInThreadHaveKeyword, true));
	if (condition.allInThreadHaveKeyword) parts.push(keywordCondition(condition.allInThreadHaveKeyword, true));
	if (condition.noneInThreadHaveKeyword) parts.push(keywordCondition(condition.noneInThreadHaveKeyword, false));
	if (condition.from) parts.push(like(messages.fromAddr, likePattern(condition.from)));
	if (condition.to) parts.push(like(messages.toAddr, likePattern(condition.to)));
	if (condition.cc) parts.push(like(messages.ccAddr, likePattern(condition.cc)));
	if (condition.bcc) parts.push(like(messages.bccAddr, likePattern(condition.bcc)));
	if (condition.subject) parts.push(like(messages.subject, likePattern(condition.subject)));
	if (condition.body) parts.push(or(like(messages.textBody, likePattern(condition.body)), like(messages.htmlBody, likePattern(condition.body)))!);
	if (condition.text) {
		const pattern = likePattern(condition.text);
		parts.push(
			or(
				like(messages.subject, pattern),
				like(messages.fromAddr, pattern),
				like(messages.toAddr, pattern),
				like(messages.ccAddr, pattern),
				like(messages.textBody, pattern),
				like(messages.snippet, pattern),
			)!,
		);
	}
	if (condition.hasAttachment !== undefined) {
		const hasOne = exists(
			sql`(SELECT 1 FROM ${messageAttachments} WHERE ${messageAttachments.messageId} = ${messages.id} AND ${messageAttachments.disposition} = 'attachment')`,
		);
		parts.push(condition.hasAttachment ? hasOne : not(hasOne));
	}
	if (condition.minSize !== undefined) parts.push(gte(sql`length(coalesce(${messages.textBody}, '')) + length(coalesce(${messages.htmlBody}, ''))`, condition.minSize));
	if (condition.maxSize !== undefined) parts.push(lt(sql`length(coalesce(${messages.textBody}, '')) + length(coalesce(${messages.htmlBody}, ''))`, condition.maxSize));
	return parts;
}

/** FilterOperator trees become nested AND/OR/NOT; a bare condition is an AND of its fields. */
export function filterToSql(filter: Filter | null | undefined, accessible: Set<string>): SQL | undefined {
	if (!filter) return undefined;
	if ("operator" in filter) {
		const children = (filter.conditions ?? []).map((child) => filterToSql(child, accessible)).filter((part): part is SQL => !!part);
		if (children.length === 0) return undefined;
		if (filter.operator === "AND") return and(...children);
		if (filter.operator === "OR") return or(...children);
		if (filter.operator === "NOT") return not(and(...children)!);
		throw invalidArguments(`Unknown operator ${String(filter.operator)}`);
	}
	const parts = conditionToSql(filter, accessible);
	return parts.length ? and(...parts) : undefined;
}

export function sortToSql(sort: Comparator[] | null | undefined): SQL[] {
	const comparators = sort && sort.length ? sort : [{ property: "receivedAt", isAscending: false }];
	return comparators.map((item) => {
		const direction = item.isAscending ? asc : desc;
		switch (item.property) {
			case "receivedAt":
			case "sentAt":
				return direction(messages.createdAt);
			case "subject":
				return direction(messages.subject);
			case "from":
				return direction(messages.fromAddr);
			case "to":
				return direction(messages.toAddr);
			case "size":
				return direction(sql`length(coalesce(${messages.textBody}, '')) + length(coalesce(${messages.htmlBody}, ''))`);
			case "hasKeyword":
			case "allInThreadHaveKeyword":
			case "someInThreadHaveKeyword": {
				const keyword = (item as Comparator & { keyword?: string }).keyword ?? KEYWORD_SEEN;
				return direction(keyword === KEYWORD_FLAGGED ? messages.starred : messages.read);
			}
			default:
				throw invalidArguments(`Cannot sort by ${item.property}`);
		}
	});
}

export { gt };
