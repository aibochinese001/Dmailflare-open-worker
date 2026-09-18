import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { getLicenseStatus } from "@/lib/licenses/service";
import { getLicenseErrorResponse, requireLicenseAdmin } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const forbidden = await requireLicenseAdmin(env, request);
	if (forbidden) return forbidden;

	try {
		return NextResponse.json({ license: await getLicenseStatus(env) }, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		return getLicenseErrorResponse(error);
	}
}
