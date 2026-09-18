import type { ReactNode } from "react";

export type TooltipProps = {
	label: string;
	children: ReactNode;
	className?: string;
};

export type TooltipPosition = {
	left: number;
	top: number;
};
