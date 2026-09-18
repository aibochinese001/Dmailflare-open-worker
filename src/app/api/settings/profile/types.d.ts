import type { updateProfileSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type ProfileResponse = {
	user: {
		id: string;
		email: string;
		name: string;
		resetEmail: string | null;
		forwardingEmail: string | null;
	};
};
