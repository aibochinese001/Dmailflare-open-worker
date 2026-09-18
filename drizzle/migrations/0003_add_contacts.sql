CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`source` text DEFAULT 'inbound' NOT NULL,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_user_email_idx` ON `contacts` (`user_id`,`email`);
--> statement-breakpoint
CREATE INDEX `contacts_user_idx` ON `contacts` (`user_id`);
