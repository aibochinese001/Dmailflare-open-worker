import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { deactivateLicense } from "@/lib/licenses/service";
import { getLicenseErrorResponse, requireLicenseAdmin } from "../utils";

export async function POST(request: Request) {
	const env = getEnv();
	const forbidden = await requireLicenseAdmin(env, request);
	if (forbidden) return forbidden;

	try {
		const license = await deactivateLicense(env);
		return NextResponse.json({ license });
	} catch (error) {
		return getLicenseErrorResponse(error);
	}
}
