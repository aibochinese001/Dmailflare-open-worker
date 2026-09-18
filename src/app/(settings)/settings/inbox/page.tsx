import { InboxThreadingSettings } from "@/components/settings/inbox-threading-settings";
import { InboxShortcutsSettings } from "@/components/settings/inbox-shortcuts-settings";
import { MailboxAutoReplyForm } from "@/components/settings/mailbox-auto-reply-form";
import { SpamFilterSettings } from "@/components/settings/spam-filter-settings";

export default function SettingsInboxPage() {
	return (
		<div className="space-y-8 py-4">
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Spam protection</h2>
					<p className="mt-1 text-sm text-neutral-500">Control local spam analysis for incoming messages.</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<SpamFilterSettings />
				</div>
			</section>
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Threading</h2>
					<p className="mt-1 text-sm text-neutral-500">Choose how emails are organized in your inbox.</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<InboxThreadingSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Shortcuts</h2>
					<p className="mt-1 text-sm text-neutral-500">Choose whether keyboard shortcuts are active.</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<InboxShortcutsSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Automatic response</h2>
					<p className="mt-1 text-sm text-neutral-500">
						Configure the subject and message for the inbox currently selected above.
					</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<MailboxAutoReplyForm />
				</div>
			</section>
		</div>
	);
}
