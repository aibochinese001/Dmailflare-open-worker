import type { updateForwardingEmailSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateForwardingEmailInput = z.infer<typeof updateForwardingEmailSchema>;
