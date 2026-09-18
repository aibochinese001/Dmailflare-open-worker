import type { ReactNode } from "react";

export type AuthGuardMode = "protected" | "public";

export type AuthGuardProps = {
	children: ReactNode;
	mode?: AuthGuardMode;
	requireMailbox?: boolean;
	requireRole?: "admin";
};
