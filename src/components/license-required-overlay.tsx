import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LicenseRequiredOverlayProps } from "./license-required-overlay-types";

export function LicenseRequiredOverlay({ required, children }: LicenseRequiredOverlayProps) {
	return <div className="relative">{children}<div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/50 p-6 backdrop-blur-[1px]"><div className="max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl"><LockKeyhole className="mx-auto h-6 w-6 text-blue-600" /><h2 className="mt-3 font-semibold text-neutral-900">{required} license required</h2><p className="mt-2 text-sm text-neutral-600">Upgrade your license to use this feature.</p><Button asChild className="mt-4"><Link href="/licenses">View licenses</Link></Button></div></div></div>;
}
