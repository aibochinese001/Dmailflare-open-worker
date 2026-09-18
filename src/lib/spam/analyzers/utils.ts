export function findHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
	const key = Object.keys(headers ?? {}).find((item) => item.toLowerCase() === name);
	return key ? headers?.[key] : undefined;
}
