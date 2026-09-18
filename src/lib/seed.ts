import {
	demoCredentials,
	ensureDemoDomain,
	ensureDemoMailboxes,
	ensureDemoUser,
	insertDemoMessages,
} from "@/lib/seed-utils";

/** Dev-only seed without Cloudflare API (domain must be onboarded separately). */
export async function seedDemoData(env: CloudflareEnv): Promise<{ messageCount: number }> {
	const user = await ensureDemoUser(env);
	const domain = await ensureDemoDomain(env, user.id);
	const mailboxMap = await ensureDemoMailboxes(env, user.id, domain.id);
	const messageCount = await insertDemoMessages(env, user.id, mailboxMap);

	console.info("Seeded demo user:", demoCredentials);

	return { messageCount };
}
