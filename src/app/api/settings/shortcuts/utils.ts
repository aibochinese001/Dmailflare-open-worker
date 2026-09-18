import { updateShortcutsSettingsSchema } from "@/lib/validators";
import type { UpdateShortcutsSettingsInput } from "./types";

export async function parseUpdateShortcutsSettingsRequest(
	request: Request,
): Promise<UpdateShortcutsSettingsInput> {
	return updateShortcutsSettingsSchema.parse(await request.json());
}
