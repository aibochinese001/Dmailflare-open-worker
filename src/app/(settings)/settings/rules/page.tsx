import { InboxRules } from "@/components/settings/inbox-rules";
import { DomainRouting } from "@/components/settings/domain-routing/domain-routing";

export default function SettingsRulesPage() {
	return (
		<div className="space-y-8">
			<div>
				<DomainRouting />
			</div>
			<div className="py-6">
				<InboxRules />
			</div>
		</div>
	);
}
