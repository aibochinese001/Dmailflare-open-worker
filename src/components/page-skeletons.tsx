import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { LoadingTransition } from "@/components/loading-transition";

export function PageSkeleton() {
	return <LoadingTransition ready />;
}

export function ListPageSkeleton() {
	return (
		<div className="h-full min-h-0">
			<div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6">
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-4 w-24" />
			</div>
			<SkeletonRows count={8} />
		</div>
	);
}

export function MessageDetailSkeleton() {
	return (
		<div className="h-full space-y-6 p-6">
			<div className="flex justify-between">
				<Skeleton className="h-9 w-9 rounded-full" />
				<Skeleton className="h-9 w-48" />
			</div>
			<Skeleton className="h-8 w-3/5" />
			<div className="flex items-start gap-3 border-b border-neutral-100 pb-5">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-48" />
					<Skeleton className="h-3 w-32" />
				</div>
				<Skeleton className="h-3 w-28" />
			</div>
			<div className="space-y-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-11/12" />
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-4 w-5/6" />
			</div>
		</div>
	);
}

export function TableSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
			<Skeleton className="h-10 w-full rounded-none" />
			<SkeletonRows count={6} />
		</div>
	);
}

export function CardGridSkeleton() {
	return (
		<div className="grid gap-3 md:grid-cols-2">
			{Array.from({ length: 4 }, (_, index) => (
				<div
					key={index}
					className="flex min-h-24 items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4"
				>
					<Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-2/5" />
						<Skeleton className="h-3.5 w-4/5" />
						<Skeleton className="h-3 w-1/3" />
					</div>
				</div>
			))}
		</div>
	);
}
