"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Archive,
  ShieldAlert,
  Trash2,
  MailPlus,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useCompose } from "@/components/compose/compose-context";
import type { ShortcutDefinition, CommandItem } from "./types";
import { useHotkeys } from "./use-hotkeys";
import { CommandPalette } from "./command-palette";
import { ShortcutsHelpDialog } from "./shortcuts-help-dialog";
import { useShortcutsEnabled } from "./use-shortcuts-enabled";

interface ShortcutsContextValue {
  shortcutsEnabled: boolean;
  shortcutsPreferenceLoading: boolean;
  shortcutsPreferenceError: string | null;
  setShortcutsEnabled: (enabled: boolean) => Promise<void>;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  registerShortcut: (shortcut: ShortcutDefinition) => void;
  registerCommand: (command: CommandItem) => void;
  shortcuts: ShortcutDefinition[];
  commands: CommandItem[];
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return ctx;
}

export function ShortcutsProvider({
  children,
  extraShortcuts = [],
  extraCommands = [],
}: {
  children: React.ReactNode;
  extraShortcuts?: ShortcutDefinition[];
  extraCommands?: CommandItem[];
}) {
  const router = useRouter();
  const { openComposer } = useCompose();
  const {
    enabled: shortcutsEnabled,
    error: shortcutsPreferenceError,
    isLoading: shortcutsPreferenceLoading,
    setEnabled: setShortcutsEnabled,
  } = useShortcutsEnabled();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [customShortcuts, setCustomShortcuts] = useState<ShortcutDefinition[]>(extraShortcuts);
  const [customCommands, setCustomCommands] = useState<CommandItem[]>(extraCommands);

  const openCommandPalette = () => {
    if (shortcutsEnabled && !shortcutsPreferenceLoading) setIsCommandPaletteOpen(true);
  };
  const closeCommandPalette = () => setIsCommandPaletteOpen(false);
  const openHelpModal = () => {
    if (shortcutsEnabled && !shortcutsPreferenceLoading) setIsHelpModalOpen(true);
  };
  const closeHelpModal = () => setIsHelpModalOpen(false);

  const registerShortcut = (shortcut: ShortcutDefinition) => {
    setCustomShortcuts((prev) => {
      const idx = prev.findIndex((s) => s.key === shortcut.key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = shortcut;
        return next;
      }
      return [...prev, shortcut];
    });
  };

  const registerCommand = (command: CommandItem) => {
    setCustomCommands((prev) => {
      const idx = prev.findIndex((c) => c.id === command.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = command;
        return next;
      }
      return [...prev, command];
    });
  };

  // Base navigation and global shortcuts
  const baseShortcuts = useMemo<ShortcutDefinition[]>(() => {
    return [
      {
        key: "k",
        modifiers: ["meta", "ctrl"],
        label: "Command Palette",
        category: "General",
        action: () => setIsCommandPaletteOpen((prev) => !prev),
      },
      {
        key: "?",
        label: "Shortcuts Cheat Sheet",
        category: "General",
        action: () => setIsHelpModalOpen((prev) => !prev),
      },
      {
        key: "c",
        label: "Compose Email",
        category: "Composing",
        action: () => openComposer(),
      },
      {
        key: "/",
        label: "Search Mail",
        category: "Navigation",
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        },
      },
      {
        key: "g i",
        label: "Go to Inbox",
        category: "Navigation",
        action: () => router.push("/inbox"),
      },
      {
        key: "g s",
        label: "Go to Starred",
        category: "Navigation",
        action: () => router.push("/starred"),
      },
      {
        key: "g z",
        label: "Go to Snoozed",
        category: "Navigation",
        action: () => router.push("/snoozed"),
      },
      {
        key: "g t",
        label: "Go to Sent",
        category: "Navigation",
        action: () => router.push("/sent"),
      },
      {
        key: "g d",
        label: "Go to Drafts",
        category: "Navigation",
        action: () => router.push("/drafts"),
      },
      {
        key: "g a",
        label: "Go to Archived",
        category: "Navigation",
        action: () => router.push("/archived"),
      },
      {
        key: "g !",
        label: "Go to Spam",
        category: "Navigation",
        action: () => router.push("/spam"),
      },
      {
        key: "g x",
        label: "Go to Trash",
        category: "Navigation",
        action: () => router.push("/trash"),
      },
      {
        key: "escape",
        label: "Dismiss Modal / Clear Focus",
        category: "General",
        action: () => {
          setIsCommandPaletteOpen(false);
          setIsHelpModalOpen(false);
        },
      },
      ...customShortcuts,
    ];
  }, [router, openComposer, customShortcuts]);

  useHotkeys(baseShortcuts, { enabled: shortcutsEnabled && !shortcutsPreferenceLoading });

  // Base Command Palette actions
  const allCommands = useMemo<CommandItem[]>(() => {
    const builtins: CommandItem[] = [
      {
        id: "compose",
        title: "Compose new message",
        subtitle: "Open draft editor",
        category: "Actions",
        icon: MailPlus,
        shortcut: "c",
        perform: () => openComposer(),
      },
      {
        id: "nav-inbox",
        title: "Go to Inbox",
        category: "Navigation",
        icon: Inbox,
        shortcut: "g i",
        perform: () => router.push("/inbox"),
      },
      {
        id: "nav-starred",
        title: "Go to Starred",
        category: "Navigation",
        icon: Star,
        shortcut: "g s",
        perform: () => router.push("/starred"),
      },
      {
        id: "nav-snoozed",
        title: "Go to Snoozed",
        category: "Navigation",
        icon: Clock,
        shortcut: "g z",
        perform: () => router.push("/snoozed"),
      },
      {
        id: "nav-sent",
        title: "Go to Sent",
        category: "Navigation",
        icon: Send,
        shortcut: "g t",
        perform: () => router.push("/sent"),
      },
      {
        id: "nav-drafts",
        title: "Go to Drafts",
        category: "Navigation",
        icon: FileText,
        shortcut: "g d",
        perform: () => router.push("/drafts"),
      },
      {
        id: "nav-archived",
        title: "Go to Archived",
        category: "Navigation",
        icon: Archive,
        shortcut: "g a",
        perform: () => router.push("/archived"),
      },
      {
        id: "nav-spam",
        title: "Go to Spam",
        category: "Navigation",
        icon: ShieldAlert,
        shortcut: "g !",
        perform: () => router.push("/spam"),
      },
      {
        id: "nav-trash",
        title: "Go to Trash",
        category: "Navigation",
        icon: Trash2,
        shortcut: "g x",
        perform: () => router.push("/trash"),
      },
      {
        id: "settings-account",
        title: "Account Settings",
        subtitle: "Profile, password & preferences",
        category: "Settings",
        icon: Settings,
        perform: () => router.push("/settings/account"),
      },
      {
        id: "show-help",
        title: "Keyboard Shortcuts Cheat Sheet",
        subtitle: "View all quick keys",
        category: "General",
        icon: HelpCircle,
        shortcut: "?",
        perform: () => setIsHelpModalOpen(true),
      },
    ];

    return [...builtins, ...customCommands];
  }, [router, openComposer, customCommands]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcutsEnabled,
        shortcutsPreferenceLoading,
        shortcutsPreferenceError,
        setShortcutsEnabled,
        openCommandPalette,
        closeCommandPalette,
        openHelpModal,
        closeHelpModal,
        registerShortcut,
        registerCommand,
        shortcuts: baseShortcuts,
        commands: allCommands,
      }}
    >
      {children}
      {shortcutsEnabled && !shortcutsPreferenceLoading && (
        <>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={closeCommandPalette}
            commands={allCommands}
          />
          <ShortcutsHelpDialog
            isOpen={isHelpModalOpen}
            onClose={closeHelpModal}
            shortcuts={baseShortcuts}
          />
        </>
      )}
    </ShortcutsContext.Provider>
  );
}
