-- Password reset links and TOTP two-factor authentication.
ALTER TABLE `users` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_confirmed_at` integer;--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`token_hash` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `mfa_recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`code_hash` text NOT NULL UNIQUE,
	`used_at` integer,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `mfa_recovery_codes_user_idx` ON `mfa_recovery_codes` (`user_id`);--> statement-breakpoint
CREATE TABLE `login_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`token_hash` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);