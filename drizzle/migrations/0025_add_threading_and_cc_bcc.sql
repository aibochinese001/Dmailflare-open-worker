-- Conversation threading and Cc/Bcc recipients.
ALTER TABLE `messages` ADD `cc_addr` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `bcc_addr` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `in_reply_to` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `references_header` text;--> statement-breakpoint
CREATE INDEX `messages_thread_idx` ON `messages` (`mailbox_id`,`thread_id`);--> statement-breakpoint
CREATE INDEX `messages_provider_message_idx` ON `messages` (`mailbox_id`,`provider_message_id`);
