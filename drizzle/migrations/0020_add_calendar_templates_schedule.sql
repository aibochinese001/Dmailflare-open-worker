ALTER TABLE `outbound_jobs` ADD `scheduled_at` integer;
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`text_body` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE INDEX `email_templates_user_idx` ON `email_templates` (`user_id`);
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`mailbox_id` text REFERENCES `mailboxes`(`id`) ON DELETE set null,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`attendees` text DEFAULT '[]' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE INDEX `calendar_events_user_starts_idx` ON `calendar_events` (`user_id`, `starts_at`);
