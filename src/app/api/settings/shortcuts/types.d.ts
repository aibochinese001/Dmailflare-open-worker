import type { updateShortcutsSettingsSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateShortcutsSettingsInput = z.infer<typeof updateShortcutsSettingsSchema>;
