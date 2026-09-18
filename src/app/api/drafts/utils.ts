import { getAuthorizedSenderAddress } from "@/lib/email/sender";
import type { DraftPayload } from "./types";

export async function getDraftSender(
	env: CloudflareEnv,
	userId: string,
	input: DraftPayload,
): Promise<{ fromAddr: string; mailboxId: string } | { error: string }> {
	try {
		return await getAuthorizedSenderAddress(env, {
			userId,
			from: input.from ?? "",
			mailboxId: input.mailboxId,
		});
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Mailbox is not authorized" };
	}
}

export function userOwnsDraft(draft: { userId: string; status: string } | undefined, userId: string): boolean {
	return !!draft && draft.userId === userId && draft.status === "draft";
}
