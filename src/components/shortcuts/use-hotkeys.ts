"use client";

import { useEffect, useRef } from "react";
import type { ShortcutDefinition } from "./types";

interface UseHotkeysOptions {
  enabled?: boolean;
}

export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toUpperCase();
  const isInputOrTextarea =
    tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
  const isContentEditable =
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true";
  return isInputOrTextarea || isContentEditable;
}

function matchModifiers(
  e: KeyboardEvent,
  shortcut: ShortcutDefinition
): boolean {
  const requiresCtrl = shortcut.modifiers?.includes("ctrl");
  const requiresMeta = shortcut.modifiers?.includes("meta");
  const requiresAlt = shortcut.modifiers?.includes("alt");
  const requiresShift = shortcut.modifiers?.includes("shift");

  const hasCtrl = e.ctrlKey;
  const hasMeta = e.metaKey;
  const hasAlt = e.altKey;
  const hasShift = e.shiftKey;

  if (requiresCtrl && requiresMeta) {
    if (!hasCtrl && !hasMeta) return false;
  } else if (requiresCtrl && !hasCtrl) {
    return false;
  } else if (requiresMeta && !hasMeta) {
    return false;
  }

  if (requiresAlt && !hasAlt) return false;
  if (requiresShift && !hasShift) return false;

  if (!requiresCtrl && !requiresMeta && (hasCtrl || hasMeta)) return false;
  if (!requiresAlt && hasAlt) return false;

  return true;
}

export function useHotkeys(
  shortcuts: ShortcutDefinition[],
  options: UseHotkeysOptions = { enabled: true }
) {
  const sequenceBufferRef = useRef<string[]>([]);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shortcutsRef = useRef<ShortcutDefinition[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (options.enabled === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = isTypingInInput(e.target);
      const key = e.key.toLowerCase();

      // Always allow Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        const cmdK = shortcutsRef.current.find(
          (s) =>
            s.key.toLowerCase() === "k" &&
            (s.modifiers?.includes("meta") || s.modifiers?.includes("ctrl"))
        );
        if (cmdK) {
          e.preventDefault();
          cmdK.action();
          return;
        }
      }

      if (isInput) {
        if (e.key === "Escape") {
          const esc = shortcutsRef.current.find(
            (s) => s.key.toLowerCase() === "escape" || s.key.toLowerCase() === "esc"
          );
          if (esc) esc.action();
        }
        return;
      }

      // Handle sequence buffer
      sequenceBufferRef.current.push(key);

      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }

      sequenceTimerRef.current = setTimeout(() => {
        sequenceBufferRef.current = [];
      }, 800);

      const currentSequence = sequenceBufferRef.current.join(" ");
      const sequenceMatch = shortcutsRef.current.find(
        (s) => s.key.toLowerCase() === currentSequence
      );

      if (sequenceMatch) {
        e.preventDefault();
        sequenceBufferRef.current = [];
        sequenceMatch.action();
        return;
      }

      const singleMatch = shortcutsRef.current.find((s) => {
        if (s.key === "?" && e.key === "?") return true;
        if (s.key === "/" && e.key === "/") return true;
        if (s.key === "#" && e.key === "#") return true;

        if (s.key.toLowerCase() !== key) return false;
        return matchModifiers(e, s);
      });

      if (singleMatch) {
        e.preventDefault();
        sequenceBufferRef.current = [];
        singleMatch.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, [options.enabled]);
}
