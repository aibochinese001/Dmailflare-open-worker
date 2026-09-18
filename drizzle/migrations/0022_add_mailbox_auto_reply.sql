ALTER TABLE `mailboxes` ADD `auto_reply_enabled` integer DEFAULT false NOT NULL;
ALTER TABLE `mailboxes` ADD `auto_reply_subject` text DEFAULT 'Out of office' NOT NULL;
ALTER TABLE `mailboxes` ADD `auto_reply_body` text DEFAULT '' NOT NULL;
CREATE TABLE `auto_reply_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade,
	`recipient` text NOT NULL,
	`sent_at` integer NOT NULL
);
CREATE UNIQUE INDEX `auto_reply_deliveries_mailbox_recipient_idx` ON `auto_reply_deliveries` (`mailbox_id`, `recipient`);
CREATE INDEX `auto_reply_deliveries_sent_idx` ON `auto_reply_deliveries` (`sent_at`);
