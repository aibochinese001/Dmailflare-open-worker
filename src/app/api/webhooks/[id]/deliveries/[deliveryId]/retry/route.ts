import { NextResponse } from "next/server";
import { runDelivery } from "@/lib/email/webhooks";
import { loadOwnedWebhook } from "../../../utils";
import type { WebhookDeliveryRouteParams } from "../../../types";

export async function POST(request: Request, { params }: WebhookDeliveryRouteParams) {
	const { id, deliveryId } = await params;
	const loaded = await loadOwnedWebhook(request, id);
	if (loaded.error) return loaded.error;

	const result = await runDelivery(loaded.env, deliveryId, { userId: loaded.user.id });
	if (!result) {
		return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
	}

	return NextResponse.json({ status: result.status });
}
