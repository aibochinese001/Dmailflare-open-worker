import { getDb } from "@/db";
import { recordRuleMatch, resolveInboundAddress, type RoutingDecision } from "@/lib/email/routing";
import { MAILFLARE_FORWARDED_HEADER } from "@/lib/email/account-forwarding";

/**
 * Resolves the routing decision for a live inbound message. Used by the Worker `email`
 * handler, where `forward()` and `setReject()` are still available on the message.
 *
 * Never throws: a routing failure must not stop mail from being stored.
 */
export async function resolveIncomingMail(
	env: CloudflareEnv,
	from: string,
	to: string,
): Promise<RoutingDecision | null> {
	try {
		const db = getDb(env);
		const decision = await resolveInboundAddress(db, to, from);
		if (decision?.ruleId) {
			await recordRuleMatch(db, decision.ruleId).catch(() => undefined);
		}
		return decision;
	} catch (error) {
		console.error(`Routing resolution failed for ${to}`, error);
		return null;
	}
}

/**
 * Forwards to a Cloudflare Email Routing destination address. Returns whether the forward
 * succeeded so the caller can decide to still store the message.
 *
 * The destination must be a verified destination address in Cloudflare Email Routing.
 */
export async function forwardMessage(
	message: ForwardableEmailMessage,
	destination: string,
): Promise<boolean> {
	try {
		const headers = new Headers();
		headers.set(MAILFLARE_FORWARDED_HEADER, "1");
		await message.forward(destination, headers);
		return true;
	} catch (error) {
		console.error(`Forwarding failed for ${message.to} -> ${destination}`, error);
		return false;
	}
}
