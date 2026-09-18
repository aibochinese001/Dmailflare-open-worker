CREATE TABLE `message_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`disposition` text DEFAULT 'attachment' NOT NULL,
	`content_id` text,
	`r2_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `message_attachments_r2_key_unique` ON `message_attachments` (`r2_key`);
CREATE INDEX `message_attachments_message_idx` ON `message_attachments` (`message_id`);
