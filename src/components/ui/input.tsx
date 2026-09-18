import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => (
		<input
			type={type}
			className={cn(
				"flex h-10 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm shadow-neutral-200/50 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	),
);
Input.displayName = "Input";
