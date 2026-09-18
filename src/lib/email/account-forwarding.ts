import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getEmailAddress } from "@/lib/email/address";
import { resolveInboundAddress } from "@/lib/email/routing";
import { getLicenseEntitlements } from "@/lib/licenses/service";

export const MAILFLARE_FORWARDED_HEADER = "X-Mailflare-Forwarded";

export async function getAccountForwardingDestination(
	env: CloudflareEnv,
	recipient: string,
): Promise<string | null> {
	if (!(await getLicenseEntitlements(env)).canForwardEmail) return null;
	const db = getDb(env);
	const decision = await resolveInboundAddress(db, recipient);
	if (!decision?.mailbox) return null;
	const [account] = await db
		.select({ forwardingEmail: users.forwardingEmail })
		.from(users)
		.where(eq(users.id, decision.mailbox.userId))
		.limit(1);
	const destination = account?.forwardingEmail?.trim() ?? "";
	if (!destination || getEmailAddress(destination).toLowerCase() === getEmailAddress(recipient).toLowerCase()) {
		return null;
	}
	return destination;
}
