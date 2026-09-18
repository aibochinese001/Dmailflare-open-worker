"use client";

import { cn } from "@/lib/utils";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TooltipPosition, TooltipProps } from "./tooltip-types";
import { getTooltipPosition } from "./tooltip-utils";

export function Tooltip({ label, children, className }: TooltipProps) {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState<TooltipPosition | null>(null);
	const triggerRef = useRef<HTMLSpanElement>(null);
	const tooltipRef = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		if (!open) return;

		function updatePosition() {
			if (!triggerRef.current || !tooltipRef.current) return;
			setPosition(getTooltipPosition(triggerRef.current, tooltipRef.current));
		}

		updatePosition();
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [label, open]);

	return (
		<span
			ref={triggerRef}
			className={cn("inline-flex", className)}
			onFocusCapture={() => setOpen(true)}
			onBlurCapture={() => setOpen(false)}
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onClickCapture={() => {
				setOpen(false);
				if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
			}}
		>
			{children}
			{open && typeof document !== "undefined" &&
				createPortal(
					<span
						ref={tooltipRef}
						role="tooltip"
						className="pointer-events-none fixed z-[100] max-w-[min(20rem,calc(100vw-1rem))] rounded-md bg-neutral-900 px-2 py-1 text-center text-xs font-medium text-white shadow-lg"
						style={{
							left: position?.left ?? 0,
							top: position?.top ?? 0,
							visibility: position ? "visible" : "hidden",
						}}
					>
						{label}
					</span>,
					document.body,
				)}
		</span>
	);
}
