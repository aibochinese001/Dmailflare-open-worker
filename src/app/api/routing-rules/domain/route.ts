import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { routingRules } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import { domainRoutingRuleSchema } from "@/lib/validators";
import {
	assertRuleMailbox,
	assertAdminRuleMailbox,
	getAdminDomain,
	getManagedDomainMailbox,
	listAdminDomainMailboxes,
	listManagedDomainMailboxes,
	listDomainRules,
	toRuleColumns,
} from "@/lib/domains/routing-rules";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	const user = auth.user;
	const searchParams = new URL(request.url).searchParams;
	const domainId = searchParams.get("domainId");
	const mailboxId = searchParams.get("mailboxId");
	if (!domainId) {
		return NextResponse.json({ error: "domainId is required" }, { status: 400 });
	}

	const db = getDb(env);
	const adminDomain = !mailboxId ? await getAdminDomain(db, user, domainId) : null;
	if (!adminDomain && (!mailboxId || !(await getManagedDomainMailbox(db, user, mailboxId, domainId)))) {
		return NextResponse.json({ error: "Domain or mailbox access is required" }, { status: 403 });
	}

	return NextResponse.json({
		rules: await listDomainRules(db, domainId),
		mailboxes: adminDomain
			? await listAdminDomainMailboxes(db, domainId)
			: await listManagedDomainMailboxes(db, user, domainId),
	});
}

export async function POST(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	const user = auth.user;
	const parsed = domainRoutingRuleSchema.safeParse(await request.json());
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	const db = getDb(env);
	const mailboxId = new URL(request.url).searchParams.get("mailboxId");
	const adminDomain = !mailboxId ? await getAdminDomain(db, user, parsed.data.domainId) : null;
	if (!adminDomain && (!mailboxId || !(await getManagedDomainMailbox(db, user, mailboxId, parsed.data.domainId)))) {
		return NextResponse.json({ error: "Domain or mailbox access is required" }, { status: 403 });
	}

	const destinationAllowed = parsed.data.mailboxId
		? adminDomain
			? await assertAdminRuleMailbox(db, parsed.data.mailboxId, parsed.data.domainId)
			: await assertRuleMailbox(db, user, parsed.data.mailboxId, parsed.data.domainId)
		: true;
	if (!destinationAllowed) {
		return NextResponse.json({ error: "Mailbox access is required for the destination" }, { status: 403 });
	}

	const id = newId("rule");
	await db.insert(routingRules).values({
		id,
		userId: user.id,
		domainId: parsed.data.domainId,
		...toRuleColumns(parsed.data),
	});

	return NextResponse.json({ id });
}
