export type RuleFolder = {
	id: string;
	name: string;
};

export type InboxRule = {
	id: string;
	pattern: string;
	matchField: "email" | "content" | "title";
	matchOperator: "contains" | "exact";
	matchValue: string;
	action: "store" | "forward" | "reject" | "spam" | "trash";
	folderId: string | null;
	priority: number;
};

export type InboxRuleInput = {
	mailboxId: string;
	matchField: "email" | "content" | "title";
	matchOperator: "contains" | "exact";
	matchValue: string;
	destination: string;
	priority: number;
};

export type InboxRulesResponse = {
	rules: InboxRule[];
	error?: string;
};

export type RuleFoldersResponse = {
	folders: RuleFolder[];
	error?: string;
};
