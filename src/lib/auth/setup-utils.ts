export function isMissingUsersTableError(error: unknown): boolean {
	let current: unknown = error;
	const visited = new Set<unknown>();

	while (current && !visited.has(current)) {
		visited.add(current);
		if (current instanceof Error && /no such table:\s*users/i.test(current.message)) {
			return true;
		}
		if (typeof current !== "object" || !("cause" in current)) break;
		current = (current as { cause?: unknown }).cause;
	}

	return false;
}
