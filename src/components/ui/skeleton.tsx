import { cn } from "@/lib/utils";
import type { SkeletonProps, SkeletonRowsProps } from "./skeleton-types";

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn("animate-pulse rounded-md bg-neutral-200/80", className)}
			{...props}
		/>
	);
}

export function SkeletonRows({
	count = 5,
	compact = false,
}: SkeletonRowsProps) {
	return (
		<div className="divide-y divide-neutral-100">
			{Array.from({ length: count }, (_, index) => (
				<div
					key={index}
					className={cn(
						"flex items-center gap-3",
						compact ? "px-4 py-3" : "px-6 py-4",
					)}
				>
					<Skeleton className="h-4 w-4 shrink-0" />
					<Skeleton className={cn("shrink-0", compact ? "h-9 w-9 rounded-full" : "h-5 w-36")} />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-3.5 w-2/3" />
						{compact && <Skeleton className="h-3 w-5/6" />}
					</div>
					<Skeleton className="h-3 w-12 shrink-0" />
				</div>
			))}
		</div>
	);
}
