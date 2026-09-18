import * as React from "react";
import { cn } from "@/lib/utils";
import type { SelectProps } from "./select-types";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <span className={cn("rounded-lg border border-neutral-200 px-2 inline-flex", containerClassName)}>
      <select
        className={cn(
          "flex w-full rounded-md bg-transparent focus-visible:border-blue-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    </span>
  ),
);
Select.displayName = "Select";
