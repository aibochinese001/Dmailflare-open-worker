import { getDb } from "@/db";
import { requireTeamAdmin } from "../../utils";
import { selectAccountById } from "../utils";

export async function getManagedAccount(request: Request, id: string) {
	const access = await requireTeamAdmin(request);
	if (access.error) return { access, account: null };
	const account = await selectAccountById(getDb(access.env), id);
	if (!account || (account.id !== access.user!.id && account.createdByUserId !== access.user!.id)) {
		return { access, account: null };
	}
	return { access, account };
}
