"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Check, LogOut, Settings, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { isIdentityMailbox } from "@/components/mailbox-provider-utils";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { authFetch } from "@/lib/auth/client";
import { logoutClientSession } from "@/lib/auth/logout";
import {
	PROFILE_AVATAR_CHANGED_EVENT,
	getProfileAvatarUrl,
} from "@/lib/profile/avatar-client";
import { PROFILE_NAME_CHANGED_EVENT } from "@/lib/profile/name-client";
import type { ProfileAvatarChangedDetail, ProfileNameChangedDetail } from "@/lib/profile/types";
import { MAILBOX_AVATAR_CHANGED_EVENT } from "@/lib/mailboxes/avatar-client";
import type { MailboxAvatarChangedDetail } from "@/lib/mailboxes/avatar-client-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import type {
	AccountAvatarProps,
	MailboxAccountRowProps,
	MailboxSelectorUser,
} from "./mailbox-selector-types";
import {
	getAccountInitial,
	getMailboxAddress,
	getMailboxName,
	isAdminPath,
} from "./mailbox-selector-utils";

function AccountAvatar({
	name,
	hasAvatar = false,
	avatarUrl = "/api/profile/avatar",
	size = "small",
	onAvatarError,
}: AccountAvatarProps) {
	const sizeClass = size === "large" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		setImageFailed(false);
	}, [avatarUrl, hasAvatar]);

	if (hasAvatar && !imageFailed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt={`${name} profile picture`}
				className={`${sizeClass} shrink-0 rounded-full border border-neutral-200 object-cover`}
				onError={() => {
					setImageFailed(true);
					onAvatarError?.();
				}}
			/>
		);
	}

	return (
		<div
			className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white`}
			aria-hidden="true"
		>
			{getAccountInitial(name)}
		</div>
	);
}

function MailboxAccountRow({ mailbox, unread, avatarUrl, onSelect }: MailboxAccountRowProps) {
	const name = getMailboxName(mailbox);

	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white"
		>
			<AccountAvatar
				name={name}
				hasAvatar={!!mailbox.hasAvatar || !!avatarUrl}
				avatarUrl={avatarUrl ?? `/api/mailboxes/${mailbox.id}/avatar`}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
					{mailbox.type === "shared" && (
						<Tooltip label="Shared inbox">
							<span title="Shared inbox" aria-label="Shared inbox" className="shrink-0 text-blue-600">
								<UsersRound className="h-3.5 w-3.5" />
							</span>
						</Tooltip>
					)}
				</div>
				<p className="truncate text-xs text-neutral-500">{getMailboxAddress(mailbox)}</p>
			</div>
			{unread > 0 && (
				<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
					{unread > 99 ? "99+" : unread}
				</span>
			)}
		</button>
	);
}

export function MailboxSelector() {
	const { selectedMailbox, setSelectedMailbox, mailboxes, isLoading } = useSelectedMailbox();
	const pathname = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [user, setUser] = useState<MailboxSelectorUser | null>(null);
	const [hasAvatar, setHasAvatar] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState("/api/profile/avatar");
	const [mailboxAvatarUrls, setMailboxAvatarUrls] = useState<Record<string, string>>({});
	const ref = useRef<HTMLDivElement>(null);
	const { counts } = useMessageCounts(null, open);

	useEffect(() => {
		function onPointerDown(event: PointerEvent) {
			if (!ref.current?.contains(event.target as Node)) setOpen(false);
		}

		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, []);

	useEffect(() => {
		authFetch("/api/auth/me", { redirectOnUnauthorized: false })
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => {
				const authData = data as { user?: MailboxSelectorUser } | null;
				setUser(authData?.user ?? null);
				setHasAvatar(!!authData?.user?.hasAvatar);
			})
			.catch(() => setUser(null));
	}, []);

	useEffect(() => {
		function onAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<ProfileAvatarChangedDetail>).detail;
			setAvatarUrl(detail?.url ?? getProfileAvatarUrl());
			setHasAvatar(true);
			setMailboxAvatarUrls((current) => {
				const next = { ...current };
				const version = Date.now();
				for (const mailbox of mailboxes) {
					if (isIdentityMailbox(mailbox)) {
						next[mailbox.id] = `/api/mailboxes/${mailbox.id}/avatar?v=${version}`;
					}
				}
				return next;
			});
		}

		window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, onAvatarChanged);
		return () => window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, onAvatarChanged);
	}, [mailboxes]);

	useEffect(() => {
		function onNameChanged(event: Event) {
			const { name } = (event as CustomEvent<ProfileNameChangedDetail>).detail;
			setUser((current) => current ? { ...current, name } : current);
		}

		window.addEventListener(PROFILE_NAME_CHANGED_EVENT, onNameChanged);
		return () => window.removeEventListener(PROFILE_NAME_CHANGED_EVENT, onNameChanged);
	}, []);

	useEffect(() => {
		function onMailboxAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<MailboxAvatarChangedDetail>).detail;
			if (!detail?.mailboxId || !detail.url) return;
			setMailboxAvatarUrls((current) => ({
				...current,
				[detail.mailboxId]: detail.url,
			}));
		}

		window.addEventListener(MAILBOX_AVATAR_CHANGED_EVENT, onMailboxAvatarChanged);
		return () => window.removeEventListener(MAILBOX_AVATAR_CHANGED_EVENT, onMailboxAvatarChanged);
	}, []);

	if (isLoading) {
		return <Skeleton className="h-10 w-10 rounded-full" />;
	}

	const selectedName = selectedMailbox ? getMailboxName(selectedMailbox) : user?.name ?? "Account";
	const selectedEmail = selectedMailbox ? getMailboxAddress(selectedMailbox) : user?.email ?? "";
	const selectedMailboxAvatarUrl = selectedMailbox
		? mailboxAvatarUrls[selectedMailbox.id]
		: undefined;
	const selectedHasAvatar = selectedMailbox
		? !!selectedMailbox.hasAvatar || !!selectedMailboxAvatarUrl
		: hasAvatar;
	const selectedAvatarUrl = selectedMailbox
		? selectedMailboxAvatarUrl ?? `/api/mailboxes/${selectedMailbox.id}/avatar`
		: avatarUrl;
	const otherMailboxes = mailboxes.filter((mailbox) => mailbox.id !== selectedMailbox?.id);
	const adminActive = isAdminPath(pathname);

	async function logout() {
		await logoutClientSession();
		setOpen(false);
		router.replace("/login");
		router.refresh();
	}

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="rounded-full p-1 transition-colors hover:bg-neutral-200"
				aria-label="Open account menu"
				aria-expanded={open}
			>
				<AccountAvatar
					name={selectedName}
					hasAvatar={selectedHasAvatar}
					avatarUrl={selectedAvatarUrl}
					onAvatarError={() => {
						if (!selectedMailbox) setHasAvatar(false);
					}}
				/>
			</button>

			{open && (
				<div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-[28px] border border-neutral-200 bg-[#eef3fb] p-3 shadow-2xl shadow-neutral-900/20">
					<div className="rounded-[22px] bg-white px-5 py-5">
						<div className="flex items-center gap-4">
							<AccountAvatar
								name={selectedName}
								hasAvatar={selectedHasAvatar}
								avatarUrl={selectedAvatarUrl}
								size="large"
								onAvatarError={() => {
									if (!selectedMailbox) setHasAvatar(false);
								}}
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="truncate text-lg font-semibold text-neutral-900">{selectedName}</p>
									{selectedMailbox?.type === "shared" && (
										<Tooltip label="Shared inbox">
											<span title="Shared inbox" aria-label="Shared inbox" className="shrink-0 text-blue-600">
												<UsersRound className="h-4 w-4" />
											</span>
										</Tooltip>
									)}
								</div>
								<p className="truncate text-sm text-neutral-500">
									{selectedEmail}
								</p>
							</div>
							<Check className="h-5 w-5 shrink-0 text-blue-600" />
						</div>
						<Link
							href="/calendar"
							onClick={() => setOpen(false)}
							className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-[#f2f6fc]"
						>
							<CalendarDays className="h-5 w-5 text-neutral-600" />
							Calendar
						</Link>
						<Link
							href="/settings/account"
							onClick={() => setOpen(false)}
							className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-[#f2f6fc]"
						>
							<Settings className="h-5 w-5 text-neutral-600" />
							Settings
						</Link>
					</div>

					{otherMailboxes.length > 0 && (
						<div className="mt-2 rounded-[22px] bg-white/55 p-1">
							<p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
								Other accounts
							</p>
							{otherMailboxes.map((mailbox) => {
								const mailboxCount = counts.mailboxes.find((count) => count.mailboxId === mailbox.id);
								return (
									<MailboxAccountRow
										key={mailbox.id}
										mailbox={mailbox}
										unread={mailboxCount?.unread ?? 0}
										avatarUrl={mailboxAvatarUrls[mailbox.id]}
										onSelect={() => {
											setSelectedMailbox(mailbox);
											setOpen(false);
										}}
									/>
								);
							})}
						</div>
					)}

					<div className="mt-2 overflow-hidden rounded-[22px] bg-white">
						{user?.role === "admin" && (
							<Link
								href="/admin"
								onClick={() => setOpen(false)}
								className={`flex items-center gap-3 border-t border-neutral-100 px-5 py-4 text-sm font-medium text-neutral-800 hover:bg-[#f2f6fc] ${adminActive ? "bg-blue-50" : ""}`}
							>
								<ShieldCheck className="h-5 w-5 text-neutral-600" />
								Admin
								{adminActive && <Check className="ml-auto h-4 w-4 text-blue-600" />}
							</Link>
						)}
						<button
							type="button"
								onClick={logout}
							className="flex w-full items-center gap-3 border-t border-neutral-100 px-5 py-4 text-left text-sm font-medium text-neutral-800 hover:bg-[#f2f6fc]"
						>
							<LogOut className="h-5 w-5 text-neutral-600" />
							Sign out
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
