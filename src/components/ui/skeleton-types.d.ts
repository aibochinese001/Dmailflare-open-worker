import type { HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export type SkeletonRowsProps = {
	count?: number;
	compact?: boolean;
};
