import { NextResponse } from "next/server";
import { sendTestDelivery } from "@/lib/email/webhooks";
import { loadOwnedWebhook } from "../utils";
import type { WebhookRouteParams } from "../types";

export async function POST(request: Request, { params }: WebhookRouteParams) {
	const { id } = await params;
	const loaded = await loadOwnedWebhook(request, id);
	if (loaded.error) return loaded.error;

	const result = await sendTestDelivery(loaded.env, loaded.hook);
	return NextResponse.json(result);
}
