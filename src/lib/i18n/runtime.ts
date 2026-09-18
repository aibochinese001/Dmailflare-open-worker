// Client-side runtime translation layer.
// The app's source strings are English; when the language is set to "zh"
// this module translates matching text nodes and attributes in place.
// Default language is Chinese; switching reloads the page so React
// re-renders the original English source and the layer re-applies.

import { ZH_DICT } from "./dictionary";

export const LANG_STORAGE_KEY = "mailflare-lang";
export type Lang = "zh" | "en";

export function getLang(): Lang {
	if (typeof window === "undefined") return "zh";
	return localStorage.getItem(LANG_STORAGE_KEY) === "en" ? "en" : "zh";
}

export function setLang(lang: Lang) {
	localStorage.setItem(LANG_STORAGE_KEY, lang);
	window.location.reload();
}

const SKIP_TAGS = new Set([
	"SCRIPT",
	"STYLE",
	"CODE",
	"PRE",
	"KBD",
	"TEXTAREA",
	"NOSCRIPT",
	"LINK",
	"META",
]);

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label"];

function translateTextNode(node: Text) {
	const raw = node.nodeValue ?? "";
	const key = raw.trim();
	if (!key || key.length > 200) return;
	const zh = ZH_DICT[key];
	if (!zh) return;
	const leading = raw.slice(0, raw.indexOf(key));
	const trailing = raw.slice(raw.indexOf(key) + key.length);
	node.nodeValue = `${leading}${zh}${trailing}`;
}

function translateElement(el: Element) {
	if (SKIP_TAGS.has(el.tagName)) return;
	for (const attr of TRANSLATABLE_ATTRS) {
		const value = el.getAttribute(attr);
		if (!value) continue;
		const key = value.trim();
		const zh = ZH_DICT[key];
		if (zh && key === value) el.setAttribute(attr, zh);
	}
	if (el.tagName === "HTML") return;
}

function walk(root: Node) {
	if (root.nodeType === Node.TEXT_NODE) {
		translateTextNode(root as Text);
		return;
	}
	if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
	// TreeWalker with mixed show flags: filter into element/text handling per node type.
	let current = walker.nextNode();
	while (current) {
		if (current.nodeType === Node.TEXT_NODE) {
			const parent = current.parentElement;
			if (parent && !SKIP_TAGS.has(parent.tagName)) translateTextNode(current as Text);
		} else {
			translateElement(current as Element);
		}
		current = walker.nextNode();
	}
}

let observer: MutationObserver | null = null;
let scheduled = false;

function scheduleTranslate() {
	if (scheduled) return;
	scheduled = true;
	requestAnimationFrame(() => {
		scheduled = false;
		walk(document.body);
	});
}

/** Start the runtime translation layer. No-op when lang is "en". */
export function startTranslation() {
	if (typeof window === "undefined") return;
	if (getLang() !== "zh") return;

	document.documentElement.lang = "zh-CN";
	walk(document.body);

	observer = new MutationObserver((mutations) => {
		// React re-renders can revert translated text; re-walk cheaply on any change.
		if (mutations.length > 0) scheduleTranslate();
	});
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
		attributes: true,
		attributeFilter: TRANSLATABLE_ATTRS,
	});
}

export function stopTranslation() {
	observer?.disconnect();
	observer = null;
}
