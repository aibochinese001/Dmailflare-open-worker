ALTER TABLE `users` ADD `spam_protection_enabled` integer DEFAULT true NOT NULL;
ALTER TABLE `messages` ADD `spam_score` integer;
ALTER TABLE `messages` ADD `spam_verdict` text;
ALTER TABLE `messages` ADD `spam_signals` text;
ALTER TABLE `messages` ADD `spam_analyzed_at` integer;
ALTER TABLE `messages` ADD `spam_analysis_error` text;
CREATE INDEX `messages_raw_r2_key_idx` ON `messages` (`raw_r2_key`);

CREATE TABLE `spam_token_stats` (
	`mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade,
	`token` text NOT NULL,
	`spam_count` integer DEFAULT 0 NOT NULL,
	`ham_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `spam_token_stats_mailbox_token_idx` ON `spam_token_stats` (`mailbox_id`, `token`);
CREATE INDEX `spam_token_stats_mailbox_idx` ON `spam_token_stats` (`mailbox_id`);

CREATE TABLE `spam_reputation` (
	`mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade,
	`type` text NOT NULL,
	`key` text NOT NULL,
	`messages_seen` integer DEFAULT 0 NOT NULL,
	`spam_count` integer DEFAULT 0 NOT NULL,
	`ham_count` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
CREATE UNIQUE INDEX `spam_reputation_mailbox_type_key_idx` ON `spam_reputation` (`mailbox_id`, `type`, `key`);
CREATE INDEX `spam_reputation_mailbox_idx` ON `spam_reputation` (`mailbox_id`);

CREATE TABLE `spam_feedback` (
	`message_id` text PRIMARY KEY NOT NULL REFERENCES `messages`(`id`) ON DELETE cascade,
	`mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade,
	`actor_user_id` text REFERENCES `users`(`id`) ON DELETE set null,
	`classification` text NOT NULL,
	`training_tokens` text NOT NULL,
	`reputation_keys` text NOT NULL,
	`tokenizer_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE INDEX `spam_feedback_mailbox_idx` ON `spam_feedback` (`mailbox_id`);
