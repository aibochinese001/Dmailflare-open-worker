import { persistAuthSession } from "@/lib/auth/client";
import type {
	DomainSetupResult,
	RegisterResult,
	SetupPreparationResult,
	SetupStatus,
} from "./types";

export async function prepareSetup(): Promise<{ ok: boolean; data: SetupPreparationResult }> {
	const res = await fetch("/api/setup/prepare", { method: "POST" });
	return {
		ok: res.ok,
		data: (await res.json()) as SetupPreparationResult,
	};
}

export async function getSetupStatus(): Promise<SetupStatus> {
	const res = await fetch("/api/setup/status");
	const data = (await res.json()) as SetupStatus;
	if (!res.ok) throw new Error(data.error ?? "Could not load setup status");
	return data;
}

export async function submitPrimaryDomain(hostname: string): Promise<{ ok: boolean; data: DomainSetupResult }> {
	const res = await fetch("/api/setup/domain", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hostname }),
	});

	return {
		ok: res.ok,
		data: (await res.json()) as DomainSetupResult,
	};
}

export async function submitRegistration(
	form: FormData,
	payload: { firstRun: boolean; domain: string; enableSending?: boolean },
): Promise<{ ok: boolean; data: RegisterResult }> {
	const res = await fetch("/api/auth/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(
			payload.firstRun
				? {
						domain: payload.domain,
						enableSending: payload.enableSending,
						username: form.get("username"),
						password: form.get("password"),
						resetEmail: form.get("resetEmail"),
						turnstileToken: form.get("turnstileToken"),
					}
				: {
						username: form.get("username"),
						password: form.get("password"),
						resetEmail: form.get("resetEmail"),
						turnstileToken: form.get("turnstileToken"),
					},
		),
	});

	return {
		ok: res.ok,
		data: (await persistAuthSession(res)) as RegisterResult,
	};
}
