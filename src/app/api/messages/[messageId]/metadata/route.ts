import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMessageMetadataForUser } from "@/lib/email/inbound";
import type { MessageMetadataRouteParams } from "./types";

export async function GET(request: Request, { params }: MessageMetadataRouteParams) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { messageId } = await params;
	const metadata = await getMessageMetadataForUser(env, user, messageId);
	if (!metadata) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(metadata);
}
