import type { ReactNode } from "react";

export type LicenseRequiredOverlayProps = {
	required: "Pro" | "Team";
	children: ReactNode;
};
