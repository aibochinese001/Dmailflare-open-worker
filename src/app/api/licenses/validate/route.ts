import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { validateLicense } from "@/lib/licenses/service";
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
		const { licenseKey } = await parseLicenseKeyRequest(request);
		const license = await validateLicense(env, licenseKey, getLicenseInstanceUrl(request));
		return NextResponse.json({ license });
	} catch (error) {
		return getLicenseErrorResponse(error);
	}
}
