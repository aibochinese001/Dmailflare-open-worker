import type { UpdateStatusResponse, UpdateWorkflowResponse } from "./admin-update-card-types";

export async function getApplicationUpdateStatus(): Promise<UpdateStatusResponse> {
	const response = await fetch("/api/admin/update", { cache: "no-store" });
	const data = (await response.json()) as UpdateStatusResponse;

	if (!response.ok) {
		throw new Error(data.error ?? "Could not check for updates");
	}

	return data;
}

export async function triggerApplicationUpdate(): Promise<UpdateWorkflowResponse> {
	const response = await fetch("/api/admin/update", { method: "POST" });
	const data = (await response.json()) as UpdateWorkflowResponse;

	if (!response.ok) {
		throw new Error(data.error ?? "Could not start the update");
	}

	return data;
}
