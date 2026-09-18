"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, MailPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkDomain, createDomain, createMailbox, getDomains } from "./utils";
import type { DomainPreflight } from "./types";

export function OnboardingClient() {
	const router = useRouter();
	const [step, setStep] = useState<1 | 2>(1);
	const [hostname, setHostname] = useState("");
	const [domainCheck, setDomainCheck] = useState<DomainPreflight | null>(null);
	const [domainChecking, setDomainChecking] = useState(false);
	const [enableSending, setEnableSending] = useState(false);
	const [domainId, setDomainId] = useState("");
	const [localPart, setLocalPart] = useState("me");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		void getDomains()
			.then((data) => {
				const primary = data.domains?.[0];
				if (!primary) return;
				setDomainId(primary.id);
				setHostname(primary.hostname);
				setStep(2);
			})
			.catch(() => undefined);
	}, []);

	async function addDomain() {
		setLoading(true);
		setError(null);

		const normalized = hostname.toLowerCase().trim();
		let checkedDomain = domainCheck;
		let sendingRequested = enableSending;
		if (checkedDomain?.hostname !== normalized) {
			const result = await checkDomain(normalized);
			if (!result.ok || !result.domain) {
				setLoading(false);
				setError(result.error ?? "Domain check failed");
				return;
			}
			checkedDomain = result.domain;
			sendingRequested = true;
			setDomainCheck(result.domain);
			setEnableSending(sendingRequested);
		}
		if (!checkedDomain) {
			setLoading(false);
			setError("Domain check failed");
			return;
		}

		const { ok, data } = await createDomain(checkedDomain.hostname, sendingRequested);
		setLoading(false);
		if (!ok || !data.domain) {
			setError(data.error ?? "Failed to add domain");
			return;
		}
		setDomainId(data.domain.id);
		setStep(2);
	}

	async function inspectDomain() {
		const normalized = hostname.toLowerCase().trim();
		if (normalized.length < 3 || domainCheck?.hostname === normalized) return;

		setDomainChecking(true);
		setError(null);
		const result = await checkDomain(normalized);
		setDomainChecking(false);
		if (!result.ok || !result.domain) {
			setDomainCheck(null);
			setEnableSending(false);
			setError(result.error ?? "Domain check failed");
			return;
		}

		setDomainCheck(result.domain);
		setEnableSending(true);
	}

	async function addMailbox() {
		setLoading(true);
		setError(null);

		const { ok, data } = await createMailbox(domainId, localPart);
		setLoading(false);
		if (!ok) {
			setError(data.error ?? "Failed to create mailbox");
			return;
		}
		router.push("/inbox");
	}

	return (
		<AuthShell
			icon={MailPlus}
			title={step === 1 ? "Connect mail routing" : "Create your first mailbox"}
			description={
				step === 1
					? "Add the Cloudflare domain that will receive mail and optionally send through this workspace."
					: "Choose the mailbox address that should open directly into the inbox."
			}
			steps={[
				{ label: "Domain", active: step === 1 },
				{ label: "Mailbox", active: step === 2 },
			]}
			footer={
				<span className="inline-flex items-center gap-2 text-neutral-500">
					Setup completes in the inbox
					<ArrowRight className="h-4 w-4" />
				</span>
			}
		>
			<div className="space-y-5">
				{step === 1 && (
					<>
						<p className="rounded-2xl bg-[#eaf1fb] px-4 py-3 text-sm leading-6 text-neutral-700">
							Your domain must use Cloudflare DNS on the same account as{" "}
							<code className="no-font-mono text-xs font-semibold text-blue-800">CF_TOKEN</code>.
						</p>
						<div className="space-y-2">
							<Label htmlFor="domain">Domain</Label>
							<Input
								id="domain"
								value={hostname}
								onChange={(e) => {
									setHostname(e.target.value);
									if (domainCheck?.hostname !== e.target.value.toLowerCase().trim()) {
										setDomainCheck(null);
										setEnableSending(false);
									}
								}}
								onBlur={() => void inspectDomain()}
								placeholder="example.com"
							/>
						</div>
						<div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
							<div>
								<Label htmlFor="onboarding-enable-sending">Enable sending</Label>
								<p className="mt-1 text-xs leading-5 text-neutral-500">
									{domainChecking
										? "Checking Cloudflare access..."
										: domainCheck
											? enableSending
												? "Required to send email."
												: "Receive-only mode."
											: "Leave the domain field to verify it."}
								</p>
							</div>
							{domainChecking ? (
								<LoaderCircle className="h-4 w-4 animate-spin text-neutral-500" />
							) : (
								<Switch
									id="onboarding-enable-sending"
									checked={enableSending}
									onCheckedChange={setEnableSending}
									disabled={!domainCheck}
								/>
							)}
						</div>
						{domainCheck && (
							<div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
								<CheckCircle2 className="h-4 w-4" />
								Domain found in Cloudflare as {domainCheck.zone.name}
							</div>
						)}
						<Button
							onClick={addDomain}
							disabled={!hostname || loading || domainChecking}
							className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
						>
							{loading ? "Adding..." : "Add domain"}
						</Button>
					</>
				)}
				{step === 2 && (
					<>
						<div className="space-y-2">
							<Label htmlFor="localPart">Mailbox address</Label>
							<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
								<Input
									id="localPart"
									value={localPart}
									onChange={(e) => setLocalPart(e.target.value)}
									className="min-w-0"
								/>
								<span className="max-w-36 truncate text-sm font-medium text-neutral-500">@{hostname}</span>
							</div>
						</div>
						<Button
							onClick={addMailbox}
							disabled={!localPart || loading}
							className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
						>
							{loading ? "Creating..." : "Go to inbox"}
						</Button>
					</>
				)}
				{error && (
					<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
						{error}
					</p>
				)}
			</div>
		</AuthShell>
	);
}
