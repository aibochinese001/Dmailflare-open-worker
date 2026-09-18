"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Upload } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ImportMessagesProps, ImportMessagesResult } from "./import-messages-types";
import { getImportSummary, importMessageFiles } from "./import-messages-utils";

export function ImportMessages({ destination, sourceLabel }: ImportMessagesProps) {
	const { selectedMailbox } = useSelectedMailbox();
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ImportMessagesResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox?.id || files.length === 0) return;

		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const nextResult = await importMessageFiles(selectedMailbox.id, files, destination);
			setResult(nextResult);
			window.dispatchEvent(new Event("mailflare:messages-changed"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-4 w-4" />
					Import mail
				</CardTitle>
				<CardDescription>
					Upload exported .eml or .mbox files from source {sourceLabel}. They will be saved to the
					matching section in the selected mailbox.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="mail-import">Mail export files</Label>
						<Input
							id="mail-import"
							type="file"
							accept=".eml,.mbox,.mbx,message/rfc822,application/mbox"
							multiple
							onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
							className="block w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm shadow-neutral-200/50 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
						/>
						<p className="text-xs leading-5 text-neutral-500">
							Imports up to 100 messages and 25 MB per upload. Duplicate Message-ID values are skipped.
						</p>
					</div>

					<Button type="submit" disabled={!selectedMailbox || files.length === 0 || loading}>
						{loading ? "Importing..." : "Import messages"}
					</Button>

					{result && (
						<div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
							<p className="font-medium">{getImportSummary(result)}</p>
							{(result.errors ?? []).length > 0 && (
								<ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
									{result.errors.slice(0, 5).map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							)}
						</div>
					)}

					{error && (
						<p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
