CREATE TABLE `mailbox_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade,
	`domain_id` text NOT NULL REFERENCES `domains`(`id`) ON DELETE cascade,
	`local_part` text NOT NULL,
	`created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `mailbox_aliases_address_idx` ON `mailbox_aliases` (`domain_id`, `local_part`);
CREATE INDEX `mailbox_aliases_mailbox_idx` ON `mailbox_aliases` (`mailbox_id`);
