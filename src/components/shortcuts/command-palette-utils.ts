import type { CommandItem } from "./types";

/**
 * Filter commands by matching title, subtitle, category, or keywords.
 */
export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) return commands;
  const lowerQuery = trimmed.toLowerCase();

  return commands.filter((cmd) => {
    const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
    const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery);
    const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
    const matchKeywords = cmd.keywords?.some((k) =>
      k.toLowerCase().includes(lowerQuery)
    );
    return matchTitle || matchSubtitle || matchCategory || matchKeywords;
  });
}

/**
 * Group commands by their category string.
 */
export function groupCommandsByCategory(
  commands: CommandItem[]
): Record<string, CommandItem[]> {
  return commands.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);
}
