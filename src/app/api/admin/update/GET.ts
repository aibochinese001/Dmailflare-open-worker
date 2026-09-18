import { NextResponse } from "next/server";
import { authorizeAdminRequest, getUpdateStatus } from "./utils";

export async function GET(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await getUpdateStatus(authorization.env));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Could not check for updates";
		const status = message.includes("must be configured") ? 503 : 502;
		return NextResponse.json({ error: message }, { status });
	}
}
