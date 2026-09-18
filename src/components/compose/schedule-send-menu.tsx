"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, X } from "lucide-react";
import {
	formatDateTimeLocal,
	getScheduleSendOptions,
	parseDateTimeLocal,
} from "./schedule-send-utils";
import type { ScheduleSendMenuProps } from "./schedule-send-types";

export function ScheduleSendMenu({ disabled, value, onChange }: ScheduleSendMenuProps) {
	const options = getScheduleSendOptions();
	const minimum = new Date(Date.now() + 5 * 60 * 1000);

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				type="button"
				disabled={disabled}
				aria-label="Schedule send options"
				className="inline-flex h-8 items-center justify-center rounded-r-lg border-l border-blue-500 bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			>
				<ChevronDown className="h-4 w-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align="start"
					sideOffset={6}
					className="z-50 min-w-56 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg"
				>
					{value && (
						<>
							<DropdownMenu.Item
								onSelect={() => onChange(null)}
								className="flex cursor-pointer items-center rounded-md px-3 py-2 outline-none hover:bg-neutral-100 focus:bg-neutral-100"
							>
								<X className="mr-2 h-4 w-4" />
								Clear schedule
							</DropdownMenu.Item>
							<DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
						</>
					)}
					{options.map((option) => (
						<DropdownMenu.Item
							key={option.label}
							onSelect={() => onChange(option.value)}
							className="cursor-pointer rounded-md px-3 py-2 outline-none hover:bg-neutral-100 focus:bg-neutral-100"
						>
							{option.label}
							<span className="ml-2 text-xs text-neutral-400">
								{option.value?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
							</span>
						</DropdownMenu.Item>
					))}
					<DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
					<DropdownMenu.Label className="px-3 pb-1 pt-2 text-xs font-medium text-neutral-500">
						Pick date &amp; time
					</DropdownMenu.Label>
					<input
						type="datetime-local"
						min={formatDateTimeLocal(minimum)}
						value={value ? formatDateTimeLocal(value) : ""}
						onChange={(event) => onChange(parseDateTimeLocal(event.target.value))}
						onKeyDown={(event) => event.stopPropagation()}
						className="mx-2 mb-2 h-9 rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-blue-400"
					/>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
