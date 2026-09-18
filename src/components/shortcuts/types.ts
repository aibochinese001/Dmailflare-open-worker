import type React from "react";

export type ModifierKey = 'ctrl' | 'meta' | 'alt' | 'shift';

export interface ShortcutDefinition {
  key: string; // e.g., 'j', 'k', 'e', 'c', '?', '/' or sequences like 'g i'
  label: string; // e.g., 'Next conversation'
  category: 'Navigation' | 'Actions' | 'Composing' | 'Selection' | 'General';
  description?: string;
  modifiers?: ModifierKey[];
  allowInInputs?: boolean;
  action: () => void;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Actions' | 'Navigation' | 'Settings' | 'Mailboxes' | 'General';
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keywords?: string[];
  perform: () => void;
}

export interface ShortcutsSettingsResponse {
  enabled?: boolean;
  error?: unknown;
}
