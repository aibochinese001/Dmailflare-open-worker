import type { SessionUser } from "./types";

export function isAdmin(user: Pick<SessionUser, "role">): boolean {
	return user.role === "admin";
}

export function assertAdmin(user: Pick<SessionUser, "role">): void {
	if (!isAdmin(user)) {
		throw new Error("Forbidden");
	}
}
