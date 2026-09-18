export function contactAvatarKeyFor(userId: string, email: string): string {
	return `contact-avatars/${userId}/${encodeURIComponent(email.trim().toLowerCase())}`;
}
