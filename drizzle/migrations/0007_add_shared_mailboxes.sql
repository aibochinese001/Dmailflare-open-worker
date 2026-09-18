ALTER TABLE `users` ADD `disabled` integer DEFAULT false NOT NULL;
ALTER TABLE `mailboxes` ADD `type` text DEFAULT 'personal' NOT NULL;
ALTER TABLE `mailboxes` ADD `disabled` integer DEFAULT false NOT NULL;

CREATE TABLE `mailbox_access` (
	`id` text PRIMARY KEY NOT NULL,
	`mailbox_id` text NOT NULL,
	`user_id` text NOT NULL,
	`permission` text DEFAULT 'read_only' NOT NULL,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `mailbox_access_mailbox_user_idx` ON `mailbox_access` (`mailbox_id`,`user_id`);
CREATE INDEX `mailbox_access_user_idx` ON `mailbox_access` (`user_id`);
CREATE INDEX `mailbox_access_mailbox_idx` ON `mailbox_access` (`mailbox_id`);

CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`target_user_id` text,
	`mailbox_id` text,
	`message_id` text,
	`action` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_user_id`);
CREATE INDEX `audit_logs_mailbox_idx` ON `audit_logs` (`mailbox_id`);
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);
