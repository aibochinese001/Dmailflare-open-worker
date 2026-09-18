import Link from "next/link";
import { Globe2, KeyRound, Mail, Palette, Settings, Users, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
	{
		href: "/mailboxes",
		title: "Mailboxes",
		description: "Create and manage mailbox addresses.",
		icon: Mail,
	},
	{
		href: "/domains",
		title: "Domains",
		description: "Add Cloudflare domains and inspect DNS state.",
		icon: Globe2,
	},
	{
		href: "/branding",
		title: "Branding",
		description: "Customize the app name, icon, and favicon.",
		icon: Palette,
	},
	{
		href: "/accounts",
		title: "Accounts",
		description: "Add and manage user accounts and their inboxes.",
		icon: Users,
	},
	{
		href: "/api-keys",
		title: "API Keys",
		description: "Manage API credentials for programmatic access.",
		icon: KeyRound,
	},
	// {
	// 	href: "/webhooks",
	// 	title: "Webhooks",
	// 	description: "Send mail events to external systems.",
	// 	icon: Webhook,
	// },
	// {
	// 	href: "/settings/account",
	// 	title: "Account",
	// 	description: "View personal account and platform configuration.",
	// 	icon: Settings,
	// },
];

export default function AdminSettingsPage() {
	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-medium text-neutral-900">Admin settings</h1>
				<p className="mt-2 text-sm text-neutral-500">
					The mail infrastructure and integrations.
				</p>
			</div>
			<div className="grid lg:grid-cols-2 gap-4">
				{sections.map((section) => {
					const Icon = section.icon;

					return (
						<Link key={section.href} href={section.href}>
							<Card className="h-full rounded-3xl border-0 bg-white p-6 transition-colors hover:bg-blue-50/60">
								<CardHeader className="flex-row items-center gap-4 space-y-0 py-0">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
										<Icon className="h-5 w-5" />
									</div>
									<CardTitle className="text-base">{section.title}</CardTitle>
								</CardHeader>
								<CardContent className="pt-4">
									<p className="text-sm text-neutral-500">{section.description}</p>
								</CardContent>
							</Card>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
