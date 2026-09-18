import type { ButtonHTMLAttributes } from "react";

export type SwitchProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onChange" | "role"
> & {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
};
