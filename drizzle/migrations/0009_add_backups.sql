CREATE TABLE `backup_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`schedule_type` text DEFAULT 'daily' NOT NULL,
	`schedule_value` integer,
	`retention_enabled` integer DEFAULT false NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`updated_at` integer NOT NULL
);

INSERT INTO `backup_settings` (`id`, `enabled`, `schedule_type`, `retention_enabled`, `retention_days`, `updated_at`)
VALUES ('default', false, 'daily', false, 30, unixepoch());

CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`trigger` text NOT NULL,
	`r2_key` text,
	`filename` text,
	`size` integer,
	`error` text,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `backups_created_idx` ON `backups` (`created_at`);
CREATE INDEX `backups_status_idx` ON `backups` (`status`);
