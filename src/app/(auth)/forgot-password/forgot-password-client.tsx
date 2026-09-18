"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileField } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "./utils";

export function ForgotPasswordClient() {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [turnstileReset, setTurnstileReset] = useState(0);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const result = await requestPasswordReset(new FormData(event.currentTarget));
			if (!result.ok) {
				setError(result.error ?? "Something went wrong. Please try again.");
				setTurnstileReset((value) => value + 1);
				return;
			}
			setSent(true);
		} catch {
			setError("Unable to reach the server. Please try again.");
			setTurnstileReset((value) => value + 1);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthShell
			icon={KeyRound}
			title="Reset your password"
			description={
				sent
					? "If that account has a recovery email, a reset link is on its way. It works for 30 minutes."
					: "Enter the address you sign in with. We will send a reset link to the recovery email on the account."
			}
			footer={
				<Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-800">
					Back to sign in
				</Link>
			}
		>
			{!sent && (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
					</div>
					{error && (
						<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
					)}
					<TurnstileField resetSignal={turnstileReset} />
					<Button type="submit" className="h-11 w-full rounded-full px-6 active:scale-[0.98]" disabled={loading}>
						{loading ? "Sending..." : "Send reset link"}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
