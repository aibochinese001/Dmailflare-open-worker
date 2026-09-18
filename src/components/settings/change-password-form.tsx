"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "./utils";

export function ChangePasswordForm() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);

		if (newPassword !== confirmPassword) {
			setStatus("New passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await updatePassword(currentPassword, newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setStatus("Password changed");
		} catch (err) {
			setStatus(err instanceof Error ? err.message : "Failed to change password");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="currentPassword">Current password</Label>
				<Input
					id="currentPassword"
					type="password"
					autoComplete="current-password"
					value={currentPassword}
					onChange={(event) => setCurrentPassword(event.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="newPassword">New password</Label>
				<Input
					id="newPassword"
					type="password"
					autoComplete="new-password"
					value={newPassword}
					onChange={(event) => setNewPassword(event.target.value)}
					minLength={8}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="confirmPassword">Confirm new password</Label>
				<Input
					id="confirmPassword"
					type="password"
					autoComplete="new-password"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					minLength={8}
					required
				/>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={loading}>
					{loading ? "Changing..." : "Change password"}
				</Button>
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
