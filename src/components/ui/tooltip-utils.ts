import type { TooltipPosition } from "./tooltip-types";

const TOOLTIP_GAP = 8;
const VIEWPORT_PADDING = 8;

export function getTooltipPosition(
	trigger: HTMLElement,
	tooltip: HTMLElement,
): TooltipPosition {
	const triggerRect = trigger.getBoundingClientRect();
	const tooltipRect = tooltip.getBoundingClientRect();
	const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
	const left = Math.min(
		Math.max(centeredLeft, VIEWPORT_PADDING),
		window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
	);
	const fitsBelow =
		window.innerHeight - triggerRect.bottom >= tooltipRect.height + TOOLTIP_GAP;
	const top = fitsBelow
		? triggerRect.bottom + TOOLTIP_GAP
		: triggerRect.top - tooltipRect.height - TOOLTIP_GAP;

	return {
		left,
		top: Math.max(VIEWPORT_PADDING, top),
	};
}
