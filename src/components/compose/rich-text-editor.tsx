"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import {
	Bold,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	RemoveFormatting,
	Strikethrough,
	Underline,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RichTextEditorProps, ToolbarCommand } from "./rich-text-editor-types";

const COMMANDS: ToolbarCommand[] = [
	{ command: "bold", label: "Bold (⌘B)", icon: Bold },
	{ command: "italic", label: "Italic (⌘I)", icon: Italic },
	{ command: "underline", label: "Underline (⌘U)", icon: Underline },
	{ command: "strikeThrough", label: "Strikethrough", icon: Strikethrough },
	{ command: "insertUnorderedList", label: "Bulleted list", icon: List },
	{ command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
	{ command: "formatBlock", label: "Quote", icon: Quote, value: "blockquote" },
];

/**
 * A small HTML editor built on contentEditable. It stays deliberately light:
 * inline styles, lists, quotes and links, with pasted content flattened to
 * text so a message never carries another site's markup.
 */
export function RichTextEditor({
	id,
	value,
	onChange,
	quotedHtml,
	disabled,
	placeholder,
	className,
	toolbarStart,
	toolbarEnd,
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement | null>(null);
	const [active, setActive] = useState<Record<string, boolean>>({});
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [showQuoted, setShowQuoted] = useState(false);
	const savedRange = useRef<Range | null>(null);

	// Keep the DOM in step with the value without resetting the caret on every keystroke.
	useEffect(() => {
		const element = editorRef.current;
		if (element && element.innerHTML !== value) element.innerHTML = value;
	}, [value]);

	useEffect(() => {
		function refresh() {
			const element = editorRef.current;
			if (!element || !element.contains(document.activeElement)) return;
			const next: Record<string, boolean> = {};
			for (const item of COMMANDS) {
				if (item.command === "formatBlock") {
					next[item.command] = document.queryCommandValue("formatBlock").toLowerCase() === "blockquote";
				} else {
					next[item.command] = document.queryCommandState(item.command);
				}
			}
			setActive(next);
		}
		document.addEventListener("selectionchange", refresh);
		return () => document.removeEventListener("selectionchange", refresh);
	}, []);

	function emit() {
		onChange(editorRef.current?.innerHTML ?? "");
	}

	function run(command: string, commandValue?: string) {
		editorRef.current?.focus();
		if (command === "formatBlock" && active.formatBlock) {
			document.execCommand("formatBlock", false, "div");
		} else {
			document.execCommand(command, false, commandValue);
		}
		emit();
	}

	function openLink() {
		const selection = window.getSelection();
		savedRange.current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
		setLinkUrl("");
		setLinkOpen(true);
	}

	function applyLink() {
		const url = linkUrl.trim();
		setLinkOpen(false);
		if (!url) return;
		const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
		editorRef.current?.focus();
		const selection = window.getSelection();
		if (savedRange.current && selection) {
			selection.removeAllRanges();
			selection.addRange(savedRange.current);
		}
		if (selection && selection.isCollapsed) {
			document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${href}</a>`);
		} else {
			document.execCommand("createLink", false, href);
		}
		emit();
	}

	function onPaste(event: ClipboardEvent<HTMLDivElement>) {
		event.preventDefault();
		const text = event.clipboardData.getData("text/plain");
		document.execCommand("insertText", false, text);
	}

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			openLink();
		}
	}

	return (
		<div className={cn("flex min-h-0 flex-1 flex-col", className)}>
			<div className="relative min-h-0 flex-1 overflow-y-auto">
				<div
					ref={editorRef}
					id={id}
					role="textbox"
					aria-multiline="true"
					aria-label="Message body"
					contentEditable={!disabled}
					suppressContentEditableWarning
					data-placeholder={placeholder}
					onInput={emit}
					onBlur={emit}
					onPaste={onPaste}
					onKeyDown={onKeyDown}
					className={cn(
						"email-body max-w-none px-4 py-3 text-sm text-neutral-900 outline-none",
						"min-h-32 empty:before:pointer-events-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]",
						disabled && "cursor-not-allowed opacity-60",
					)}
				/>
				{quotedHtml && (
					<div className="px-4 pb-3">
						<button
							type="button"
								onClick={() => setShowQuoted((open) => !open)}
							aria-expanded={showQuoted}
							className="rounded-full border border-neutral-200 bg-neutral-100 px-2 text-xs leading-5 text-neutral-500 hover:bg-neutral-200"
							title={showQuoted ? "Hide quoted text" : "Show quoted text"}
						>
							•••
						</button>
						{showQuoted && (
							<div
								className="email-body mt-2 max-w-none border-l-2 border-neutral-200 pl-3 text-sm text-neutral-600"
								dangerouslySetInnerHTML={{ __html: quotedHtml }}
							/>
						)}
					</div>
				)}
			</div>
			<div className="relative flex items-center gap-0.5 border-t border-neutral-100 px-4 py-3">
				{toolbarStart}
				{COMMANDS.map((item) => (
					<Tooltip key={item.command} label={item.label}>
						<button
							type="button"
							aria-label={item.label}
							aria-pressed={!!active[item.command]}
							disabled={disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => run(item.command, item.value)}
							className={cn(
								"rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
								active[item.command] && "bg-neutral-200 text-neutral-900",
							)}
						>
							<item.icon className="h-4 w-4" />
						</button>
					</Tooltip>
				))}
				<Tooltip label="Insert link (⌘K)">
					<button
						type="button"
							aria-label="Insert link"
							disabled={disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={openLink}
							className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
						>
							<Link2 className="h-4 w-4" />
						</button>
					</Tooltip>
					<Tooltip label="Clear formatting">
						<button
							type="button"
								aria-label="Clear formatting"
								disabled={disabled}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => run("removeFormat")}
								className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
						>
							<RemoveFormatting className="h-4 w-4" />
						</button>
					</Tooltip>
				{toolbarEnd}
				{linkOpen && (
					<form
						className="absolute bottom-full left-2 z-10 mb-1 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
						onSubmit={(event) => {
							event.preventDefault();
							applyLink();
						}}
					>
						<input
							autoFocus
							value={linkUrl}
								onChange={(event) => setLinkUrl(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Escape") setLinkOpen(false);
							}}
							placeholder="https://example.com"
							className="h-8 w-64 rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-blue-400"
						/>
						<button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
							Apply
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
