import { getEnv } from "@/lib/cloudflare";
import { handleJmapRequest } from "@/lib/jmap/handler";

/** RFC 8620 §2.2 autodiscovery: redirects to the Session resource. */
export async function GET(request: Request) {
	return (await handleJmapRequest(request, getEnv())) ?? new Response("Not found", { status: 404 });
}
export const dynamic = "force-dynamic";
