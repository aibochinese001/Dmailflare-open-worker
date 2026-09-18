"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContactAvatarForm } from "./contact-avatar-form";
import { Label } from "@/components/ui/label";
import type { ContactDetailsRecord, ContactDetailsTriggerProps } from "./contact-details-types";
import {
	fetchContactDetails,
	updateContactName,
} from "./contact-details-utils";

export function ContactDetailsTrigger({
	mailboxId,
	address,
	name,
	className,
}: ContactDetailsTriggerProps) {
	const [open, setOpen] = useState(false);
	const [shownName, setShownName] = useState(name);
	const [contact, setContact] = useState<ContactDetailsRecord | null>(null);
	const [displayName, setDisplayName] = useState(name);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setShownName(name);
	}, [name]);

	useEffect(() => {
		if (!open || !mailboxId) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchContactDetails(mailboxId, address)
			.then((nextContact) => {
				if (cancelled) return;
				setContact(nextContact);
				setDisplayName(nextContact.displayName ?? shownName);
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load contact");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [address, mailboxId, open, shownName]);

	async function saveContact() {
		if (!mailboxId || !displayName.trim()) return;
		setSaving(true);
		setError(null);
		try {
			const updated = await updateContactName(mailboxId, address, displayName);
			const nextName = updated.displayName ?? displayName.trim();
			setContact(updated);
			setShownName(nextName);
			setOpen(false);
			window.dispatchEvent(new CustomEvent("mailflare:contact-changed", {
				detail: { email: updated.email, displayName: nextName },
			}));
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to update contact");
		} finally {
			setSaving(false);
		}
	}

	if (!mailboxId) return <span className={className}>{shownName}</span>;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={`${className ?? ""} rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200`}
			>
				{shownName}
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Contact details</DialogTitle>
						<DialogDescription>Update how this contact appears in your mailbox.</DialogDescription>
					</DialogHeader>
					<div className="space-y-5">
						<div className="flex flex-col items-start gap-4">
							<ContactAvatarForm
								mailboxId={mailboxId}
								address={address}
								name={shownName}
								hasAvatar={contact?.hasAvatar ?? false}
								onAvatarChange={(hasAvatar) => setContact((current) => current ? { ...current, hasAvatar } : current)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-display-name">Name</Label>
							<Input
								id="contact-display-name"
								value={displayName}
								onChange={(event) => setDisplayName(event.target.value)}
								disabled={loading || saving}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-email">Email</Label>
							<Input
								id="contact-email"
								value={contact?.email ?? address}
								disabled
							/>
						</div>
						<div className="grid gap-3 rounded-lg bg-neutral-50 p-3 text-sm sm:grid-cols-2">
							<div>
								<p className="text-xs font-medium uppercase text-neutral-400">Source</p>
								<p className="mt-1 capitalize text-neutral-700">{contact?.source ?? "Email"}</p>
							</div>
							<div>
								<p className="text-xs font-medium uppercase text-neutral-400">Last seen</p>
								<p className="mt-1 text-neutral-700">
									{contact?.lastSeenAt ? dayjs(contact.lastSeenAt).format("MMM DD, YYYY") : "Unknown"}
								</p>
							</div>
							{contact?.blocked && (
								<p className="text-sm font-medium text-red-600">Blocked contact</p>
							)}
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button
							type="button"
							onClick={saveContact}
							disabled={loading || saving || !displayName.trim()}
						>
							{saving ? "Saving..." : "Save contact"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
