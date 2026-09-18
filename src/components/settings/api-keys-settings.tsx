"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/auth/client";
import { parseApiKeyScopes } from "./api-key-utils";

interface ApiKey {
	id: string;
	name: string;
	prefix: string;
	scopes: string;
	createdAt: string;
	lastUsedAt: string | null;
}

const ALL_SCOPES: Array<{ value: "send" | "read" | "jmap"; label: string; hint: string }> = [
	{ value: "read", label: "read", hint: "Read mail and list mailboxes (required for MailSorta and other integrations)" },
	{ value: "send", label: "send", hint: "Send email through the API" },
	{ value: "jmap", label: "jmap", hint: "Connect JMAP mail apps (Mailtemi, Twake Mail, aerc)" },
];

/**
 * Settings > Account card for creating and managing API keys with
 * explicit scope selection. Unlike the JMAP card (which mints a fixed
 * jmap-scope key), this lets users grant read/send access for API
 * integrations such as MailSorta.
 */
export function ApiKeysSettings() {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [scopes, setScopes] = useState<string[]>(["read"]);
	const [newKey, setNewKey] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["api-keys"],
		queryFn: async () => {
			const res = await authFetch("/api/api-keys");
			return (await res.json()) as { apiKeys: ApiKey[] };
		},
	});

	const create = useMutation({
		mutationFn: async () => {
			const res = await authFetch("/api/api-keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, scopes }),
			});
			const json = (await res.json()) as { key?: string; error?: unknown };
			if (!res.ok) throw new Error(String(json.error ?? "Failed"));
			setNewKey(json.key ?? null);
			setName("");
		},
		onSuccess: () => {
			setCreateOpen(false);
			qc.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});

	const revoke = useMutation({
		mutationFn: async (id: string) => {
			const res = await authFetch(`/api/api-keys/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed");
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
	});

	function toggleScope(scope: string) {
		setScopes((current) =>
			current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope],
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<p className="text-sm text-neutral-500">
					Create API keys for integrations (MailSorta, AI agents, scripts). Pick only the scopes each integration needs.
				</p>
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							New API key
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create API key</DialogTitle>
							<DialogDescription>Name the key and choose what it can do.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="api-key-name">Name</Label>
								<Input
									id="api-key-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="MailSorta integration"
								/>
							</div>
							<div className="space-y-2">
								<Label>Scopes</Label>
								<div className="space-y-2">
									{ALL_SCOPES.map((scope) => (
										<label key={scope.value} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3">
											<input
													type="checkbox"
													checked={scopes.includes(scope.value)}
													onChange={() => toggleScope(scope.value)}
													className="mt-1"
												/>
											<span>
												<Badge variant="outline">{scope.label}</Badge>
												<span className="mt-1 block text-xs text-neutral-500">{scope.hint}</span>
											</span>
										</label>
									))}
								</div>
							</div>
							{create.isError && (
								<p className="text-sm text-red-600">{(create.error as Error).message}</p>
							)}
							<Button
								onClick={() => create.mutate()}
								disabled={!name || scopes.length === 0 || create.isPending}
							>
								{create.isPending ? "Creating..." : "Create key"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{newKey && (
				<Card className="border-blue-600/10 bg-blue-400/10">
					<CardContent className="pt-6">
						<p className="text-sm font-medium text-blue-600">Copy your key now:</p>
						<code className="mt-2 block break-all text-xs font-bold">{newKey}</code>
						<p className="mt-2 text-xs text-neutral-500">This key is shown only once.</p>
					</CardContent>
				</Card>
			)}

			{isLoading && <p className="text-sm text-neutral-500">Loading...</p>}
			{!isLoading && (data?.apiKeys ?? []).length === 0 && (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
					No API keys yet
				</p>
			)}
			<div className="space-y-2">
				{(data?.apiKeys ?? []).map((key) => (
					<div
						key={key.id}
						className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
					>
						<span className="min-w-0 flex-1 space-y-1">
							<span className="block truncate text-sm font-semibold text-neutral-900">{key.name}</span>
							<span className="block truncate font-mono text-xs text-neutral-500">{key.prefix}...</span>
							<span className="flex flex-wrap gap-1">
								{parseApiKeyScopes(key.scopes).map((scope) => (
									<Badge key={scope} variant="outline">{scope}</Badge>
								))}
							</span>
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => revoke.mutate(key.id)}
							disabled={revoke.isPending}
						>
							<KeyRound className="h-3.5 w-3.5" />
							Revoke
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
