import { TableSkeleton } from "@/components/page-skeletons";

export default function AdminLoading() {
	return (
		<div className="w-full max-w-3xl space-y-8 py-2">
			<div className="space-y-3">
				<div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
				<div className="h-4 w-80 animate-pulse rounded bg-neutral-100" />
			</div>
			<TableSkeleton />
		</div>
	);
}
