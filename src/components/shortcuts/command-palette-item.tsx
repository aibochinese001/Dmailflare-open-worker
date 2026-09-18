"use client";

import React from "react";
import type { CommandItem } from "./types";

interface CommandPaletteItemProps {
  item: CommandItem;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export function CommandPaletteItem({
  item,
  isActive,
  onSelect,
  onHover,
}: CommandPaletteItemProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive
                ? "text-white"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          />
        )}
        <div className="truncate">
          <span className="text-sm font-medium">{item.title}</span>
          {item.subtitle && (
            <span
              className={`ml-2 text-xs truncate ${
                isActive
                  ? "text-blue-100"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {item.subtitle}
            </span>
          )}
        </div>
      </div>
      {item.shortcut && (
        <kbd
          className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ${
            isActive
              ? "bg-blue-700 text-blue-100"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
          }`}
        >
          {item.shortcut}
        </kbd>
      )}
    </button>
  );
}
