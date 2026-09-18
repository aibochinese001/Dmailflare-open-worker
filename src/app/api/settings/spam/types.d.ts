import type { updateSpamSettingsSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateSpamSettingsInput = z.infer<typeof updateSpamSettingsSchema>;
