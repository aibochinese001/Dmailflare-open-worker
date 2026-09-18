import type { changePasswordSchema } from "@/lib/validators";
import type { z } from "zod";

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
