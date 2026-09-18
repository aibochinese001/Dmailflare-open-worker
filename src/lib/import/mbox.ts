const FROM_LINE = /^From /;

function trimTrailingLineBreaks(value: string): string {
	return value.replace(/\r?\n$/, "");
}

function unescapeMboxBody(value: string): string {
	return value.replace(/\n>From /g, "\nFrom ");
}

export function splitMboxMessages(content: string): string[] {
	const normalized = content.replace(/\r\n/g, "\n");
	const lines = normalized.split("\n");
	const messages: string[] = [];
	let current: string[] = [];

	for (const line of lines) {
		if (FROM_LINE.test(line)) {
			if (current.length > 0) {
				messages.push(unescapeMboxBody(trimTrailingLineBreaks(current.join("\n"))));
				current = [];
			}
			continue;
		}
		current.push(line);
	}

	if (current.length > 0) {
		messages.push(unescapeMboxBody(trimTrailingLineBreaks(current.join("\n"))));
	}

	return messages.filter((message) => message.trim().length > 0);
}
