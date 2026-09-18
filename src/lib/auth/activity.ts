import { createAuditLog } from "@/lib/mailboxes/audit";
import type { AuthActivityAction, AuthActivityMetadata } from "./activity-types";

export async function recordAuthActivity(
	env: CloudflareEnv,
	input: {
		action: AuthActivityAction;
		userId: string;
		request: Request;
	},
): Promise<void> {
	try {
		await createAuditLog(env, {
			actorUserId: input.userId,
			targetUserId: input.userId,
			action: input.action,
			metadata: getAuthActivityMetadata(input.request),
		});
	} catch {
		// Authentication should not fail because activity logging is unavailable.
	}
}

export function getAuthActivityMetadata(request: Request): AuthActivityMetadata {
	const userAgent = request.headers.get("user-agent") ?? "";
	return {
		ipAddress: getRequestIpAddress(request),
		city: getHeaderValue(request, "cf-ipcity"),
		country: getHeaderValue(request, "cf-ipcountry"),
		device: getDevice(userAgent),
		platform: getPlatform(userAgent),
		userAgent,
	};
}

function getRequestIpAddress(request: Request): string {
	const cfIp = getHeaderValue(request, "cf-connecting-ip");
	if (cfIp) return cfIp;
	const forwardedFor = getHeaderValue(request, "x-forwarded-for");
	return forwardedFor?.split(",")[0]?.trim() || "Unknown";
}

function getHeaderValue(request: Request, name: string): string | null {
	const value = request.headers.get(name)?.trim();
	return value || null;
}

function getDevice(userAgent: string): string {
	if (/ipad|tablet/i.test(userAgent)) return "Tablet";
	if (/mobi|iphone|android/i.test(userAgent)) return "Mobile";
	return "Desktop";
}

function getPlatform(userAgent: string): string {
	if (/windows/i.test(userAgent)) return "Windows";
	if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
	if (/android/i.test(userAgent)) return "Android";
	if (/mac os|macintosh/i.test(userAgent)) return "macOS";
	if (/linux/i.test(userAgent)) return "Linux";
	return "Unknown";
}
