import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ResetPasswordClient } from "./reset-password-client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
	return (
		<AuthGuard mode="public">
			<Suspense>
				<ResetPasswordClient />
			</Suspense>
		</AuthGuard>
	);
}
