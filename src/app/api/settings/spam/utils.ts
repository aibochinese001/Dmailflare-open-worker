import { updateSpamSettingsSchema } from "@/lib/validators";
import type { UpdateSpamSettingsInput } from "./types";

export async function parseUpdateSpamSettingsRequest(request: Request): Promise<UpdateSpamSettingsInput> {
	return updateSpamSettingsSchema.parse(await request.json());
}
