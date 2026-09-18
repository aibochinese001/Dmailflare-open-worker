import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { licenseSettings } from "@/db/schema";

export async function isTeamMailboxSharingEnabled(db: AppDatabase): Promise<boolean> {
	try {
		const [license] = await db
			.select({ plan: licenseSettings.plan, state: licenseSettings.state })
			.from(licenseSettings)
			.where(eq(licenseSettings.id, "default"))
			.limit(1);

		return license?.plan === "team" && license.state === "active";
	} catch {
		return false;
	}
}
