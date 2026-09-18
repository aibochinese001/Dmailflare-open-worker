"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordForm } from "./change-password-form";
import { ApiKeysSettings } from "./api-keys-settings";
import { EmailClientsSettings } from "./email-clients-settings";
import { MfaSettings } from "./mfa-settings";
import { ForwardingEmailForm } from "./forwarding-email-form";
import { MailboxSignatureForm } from "./mailbox-signature-form";
import { ProfileForm } from "./profile-form";
import type { AccountSettingsResponse } from "./types";
import { loadAccountSettings } from "./utils";

export function AccountSettings() {
	const [user, setUser] = useState<AccountSettingsResponse["user"]>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		loadAccountSettings()
			.then((nextUser) => {
				if (!cancelled) setUser(nextUser);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load account");
			});

		return () => {
			cancelled = true;
		};
	}, []);

	if (error) {
		return <p className="py-8 text-sm text-red-600">{error}</p>;
	}

	if (!user) {
		return (
			<div className="space-y-6 py-4">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-72 w-full rounded-3xl" />
			</div>
		);
	}

	return (
		<div className="space-y-8 py-4">
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Account details</h2>
					<p className="mt-1 text-sm text-neutral-500">Manage your identity, recovery options, and email preferences.</p>
				</div>
				<div className="space-y-1 overflow-hidden rounded-3xl">
					<ProfileForm
						initialName={user.name}
						initialResetEmail={user.resetEmail ?? ""}
						email={user.email}
					/>

					{user.canForwardEmail && (
						<div className="space-y-4 rounded-lg bg-white p-6">
							<div>
								<h3 className="text-lg font-semibold text-neutral-900">Forwarding email</h3>
								<p className="mt-1 text-sm text-neutral-500">Send a copy of incoming messages to another email address.</p>
							</div>
						<ForwardingEmailForm initialForwardingEmail={user.forwardingEmail ?? ""} />
						</div>
					)}

					<div className="space-y-4 rounded-b-3xl rounded-t-lg bg-white p-6">
						<div>
							<h3 className="text-lg font-semibold text-neutral-900">Email signature</h3>
							<p className="mt-1 text-sm text-neutral-500">Configure the signature for the inbox currently selected above.</p>
						</div>
					<MailboxSignatureForm />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Security</h2>
					<p className="mt-1 text-sm text-neutral-500">Manage how you sign in to your account.</p>
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<div>
						<h3 className="text-lg font-semibold text-neutral-900">Change password</h3>
						<p className="mt-1 text-sm text-neutral-500">Use at least 8 characters for your new password.</p>
					</div>
					<ChangePasswordForm />
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<div>
						<h3 className="text-lg font-semibold text-neutral-900">Two-factor authentication</h3>
						<p className="mt-1 text-sm text-neutral-500">Require a code from an authenticator app when signing in.</p>
					</div>
					<MfaSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">API Keys</h2>
					<p className="mt-1 text-sm text-neutral-500">Create and manage API keys for integrations such as MailSorta, AI agents, and scripts.</p>
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<ApiKeysSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Email apps</h2>
					<p className="mt-1 text-sm text-neutral-500">Use your mail from a desktop or mobile app over JMAP.</p>
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<EmailClientsSettings />
				</div>
			</section>
		</div>
	);
}
