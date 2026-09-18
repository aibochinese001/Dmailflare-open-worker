import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { activateLicense } from "@/lib/licenses/service";
import {
	getLicenseErrorResponse,
	getLicenseInstanceUrl,
	parseLicenseKeyRequest,
	requireLicenseAdmin,
} from "../utils";

export async function POST(request: Request) {
	const env = getEnv();
	const forbidden = await requireLicenseAdmin(env, request);
	if (forbidden) return forbidden;

	try {
		const { licenseKey, plan } = await parseLicenseKeyRequest(request);
		if (!plan) return NextResponse.json({ error: "Choose Pro or Team" }, { status: 400 });
		const license = await activateLicense(env, licenseKey, getLicenseInstanceUrl(request), plan);
		return NextResponse.json({ license });
	} catch (error) {
		return getLicenseErrorResponse(error);
	}
}
