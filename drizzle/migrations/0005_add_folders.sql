CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mailbox_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_mailbox_name_idx` ON `folders` (`mailbox_id`,`name`);
--> statement-breakpoint
CREATE INDEX `folders_user_idx` ON `folders` (`user_id`);
--> statement-breakpoint
CREATE INDEX `folders_mailbox_idx` ON `folders` (`mailbox_id`);
--> statement-breakpoint
ALTER TABLE `messages` ADD `folder_id` text REFERENCES `folders`(`id`) ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `messages_folder_idx` ON `messages` (`folder_id`);
--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `folder_id` text REFERENCES `folders`(`id`) ON DELETE set null;
