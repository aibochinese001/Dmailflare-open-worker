import { updateProfileSchema } from "@/lib/validators";
import type { UpdateProfileInput } from "./types";

export async function parseUpdateProfileRequest(request: Request): Promise<UpdateProfileInput> {
	const body = await request.json();
	return updateProfileSchema.parse(body);
}
