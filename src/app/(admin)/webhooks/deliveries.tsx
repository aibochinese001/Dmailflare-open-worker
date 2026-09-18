"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WebhookDelivery } from "./types";
import {
	DELIVERY_STATUS_LABELS,
	fetchDeliveries,
	formatDuration,
	formatTimestamp,
	isRetryable,
	retryDelivery,
} from "./utils";

const STATUS_STYLES: Record<WebhookDelivery["status"], string> = {
	delivered: "bg-green-600/10 text-green-700",
	failed: "bg-red-600/10 text-red-700",
	exhausted: "bg-red-600/10 text-red-700",
	retrying: "bg-amber-500/10 text-amber-700",
	pending: "bg-neutral-200 text-neutral-700",
};

export function WebhookDeliveries({ webhookId }: { webhookId: string }) {
	const qc = useQueryClient();
	const deliveries = useQuery({
		queryKey: ["webhook-deliveries", webhookId],
		queryFn: () => fetchDeliveries(webhookId),
		// Retries land asynchronously from the queue, so keep the table fresh while it is open.
		refetchInterval: 15_000,
	});

	const retry = useMutation({
		mutationFn: (deliveryId: string) => retryDelivery(webhookId, deliveryId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["webhook-deliveries", webhookId] });
			qc.invalidateQueries({ queryKey: ["webhooks"] });
		},
	});

	if (deliveries.isLoading) {
		return <p className="text-sm text-neutral-500">Loading deliveries…</p>;
	}

	if (!deliveries.data?.length) {
		return <p className="text-sm text-neutral-500">No deliveries recorded yet.</p>;
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-neutral-200">
			<table className="w-full min-w-[820px] text-left text-sm">
				<thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
					<tr>
						<th className="px-3 py-2 font-medium">Event</th>
						<th className="px-3 py-2 font-medium">Status</th>
						<th className="px-3 py-2 font-medium">Attempts</th>
						<th className="px-3 py-2 font-medium">Response</th>
						<th className="px-3 py-2 font-medium">Last attempt</th>
						<th className="px-3 py-2 font-medium">Next retry</th>
						<th className="px-3 py-2 font-medium" />
					</tr>
				</thead>
				<tbody>
					{deliveries.data.map((delivery) => (
						<tr key={delivery.id} className="border-t border-neutral-100 align-top">
							<td className="px-3 py-2">
								<span className="block">{delivery.eventType}</span>
								<span className="block text-xs text-neutral-400">
									{formatTimestamp(delivery.createdAt)}
								</span>
							</td>
							<td className="px-3 py-2">
								<Badge className={STATUS_STYLES[delivery.status]}>
									{DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
								</Badge>
							</td>
							<td className="px-3 py-2 whitespace-nowrap">
								{/* Manual retries can push attempts past the configured max, so never show "3 / 2". */}
								{delivery.attempts} / {Math.max(delivery.maxAttempts, delivery.attempts)}
							</td>
							<td className="px-3 py-2">
								<span className="block whitespace-nowrap">
									{delivery.responseStatus ?? "—"}
									{delivery.durationMs !== null && (
										<span className="ml-1 text-xs text-neutral-400">
											· {formatDuration(delivery.durationMs)}
										</span>
									)}
								</span>
								{delivery.error && (
									<span className="mt-1 block max-w-xs truncate text-xs text-red-600" title={delivery.error}>
										{delivery.error}
									</span>
								)}
							</td>
							<td className="px-3 py-2 whitespace-nowrap text-neutral-600">
								{formatTimestamp(delivery.lastAttemptAt)}
							</td>
							<td className="px-3 py-2 whitespace-nowrap text-neutral-600">
								{formatTimestamp(delivery.nextRetryAt)}
							</td>
							<td className="px-3 py-2">
								{isRetryable(delivery) && (
									<Button
										variant="outline"
										size="sm"
										disabled={retry.isPending}
										onClick={() => retry.mutate(delivery.id)}
									>
										<RotateCw className="h-3 w-3" /> Retry
									</Button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
