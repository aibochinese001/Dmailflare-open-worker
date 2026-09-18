"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "./utils";

export function ResetPasswordClient() {
	const token = useSearchParams().get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (password !== confirm) {
			setError("Passwords do not match");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const result = await confirmPasswordReset(token, password);
			if (!result.ok) {
				setError(result.error ?? "Could not reset the password");
				return;
			}
			setDone(true);
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<AuthShell icon={LockKeyhole} title="Reset link missing" description="Open the link from the reset email to choose a new password.">
				<Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
					Request a new link
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			icon={LockKeyhole}
			title={done ? "Password updated" : "Choose a new password"}
			description={
				done
					? "You have been signed out everywhere. Sign in with your new password to continue."
					: "Use at least 8 characters. Every other session for this account will be signed out."
			}
			footer={
				done ? (
					<Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
						Go to sign in
					</Link>
				) : undefined
			}
		>
			{!done && (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="password">New password</Label>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							minLength={8}
							required
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm">Confirm new password</Label>
						<Input
							id="confirm"
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={(event) => setConfirm(event.target.value)}
							minLength={8}
							required
						/>
					</div>
					{error && (
						<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
					)}
					<Button type="submit" className="h-11 w-full rounded-full px-6 active:scale-[0.98]" disabled={loading}>
						{loading ? "Saving..." : "Set new password"}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
