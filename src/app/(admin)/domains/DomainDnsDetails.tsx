import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDnsRecordLabel } from "./domain-dns-details-utils";
import type { DomainDnsDetailsProps } from "./types";

export default function DomainDnsDetails({ domain, dns }: DomainDnsDetailsProps) {
	return (
		<Card className="rounded-3xl border-0 bg-white p-6">
			<CardHeader className="py-0">
				<CardTitle>DNS — {domain.hostname}</CardTitle>
			</CardHeader>
			<CardContent className="gap-6 pt-5">
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-neutral-900">Email Routing</h2>
					<ul className="space-y-2">
						{dns.routing.records.map((record, index) => (
							<li
								key={`routing-${record.type}-${record.name}-${index}`}
								className="flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800"
							>
								<Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
								<span className="break-all">{getDnsRecordLabel(record)}</span>
							</li>
						))}
						{dns.routing.missing.map((record, index) => (
							<li
								key={`missing-${record.type}-${record.name}-${index}`}
								className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
							>
								<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
								<span className="break-all">{getDnsRecordLabel(record)}</span>
							</li>
						))}
						{dns.routing.records.length === 0 && dns.routing.missing.length === 0 && (
							<li className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${domain.routingEnabled ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
								{domain.routingEnabled ? (
									<Check className="h-4 w-4 shrink-0 text-green-600" />
								) : (
									<AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
								)}
								{domain.routingEnabled ? "Email routing is configured" : "No routing DNS records found"}
							</li>
						)}
					</ul>
				</section>

				<section className="space-y-3 mt-8">
					<h2 className="text-sm font-medium text-neutral-900">Email Sending</h2>
					<ul className="space-y-2">
						{dns.sending.map((record, index) => (
							<li
								key={`sending-${record.type}-${record.name}-${index}`}
								className="flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800"
							>
								<Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
								<span className="break-all">{getDnsRecordLabel(record)}</span>
							</li>
						))}
						{dns.sending.length === 0 && (
							<li className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${domain.sendingEnabled ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
								{domain.sendingEnabled ? (
									<Check className="h-4 w-4 shrink-0 text-green-600" />
								) : (
									<AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
								)}
								{domain.sendingEnabled ? "Email sending is configured" : "No sending DNS records found"}
							</li>
						)}
					</ul>
				</section>
			</CardContent>
		</Card>
	);
}
