import { getEnv } from "@/lib/cloudflare";
import { handleJmapRequest } from "@/lib/jmap/handler";

async function handle(request: Request) {
	return (await handleJmapRequest(request, getEnv())) ?? new Response("Not found", { status: 404 });
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const dynamic = "force-dynamic";
