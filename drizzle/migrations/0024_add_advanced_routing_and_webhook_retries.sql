-- Advanced routing rules: domain-scoped catch-all, forward, and reject/block rules with priorities.
ALTER TABLE `routing_rules` ADD `scope` text DEFAULT 'mailbox' NOT NULL;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `name` text;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `keep_copy` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `reject_reason` text;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `last_matched_at` integer;--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `match_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `routing_rules_domain_scope_idx` ON `routing_rules` (`domain_id`,`scope`,`enabled`);--> statement-breakpoint
CREATE INDEX `routing_rules_mailbox_idx` ON `routing_rules` (`mailbox_id`);--> statement-breakpoint
CREATE INDEX `routing_rules_priority_idx` ON `routing_rules` (`priority`);--> statement-breakpoint

-- Webhook management and delivery retry visibility.
ALTER TABLE `webhooks` ADD `description` text;--> statement-breakpoint
ALTER TABLE `webhooks` ADD `max_attempts` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD `response_status` integer;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD `error` text;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD `last_attempt_at` integer;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD `next_retry_at` integer;--> statement-breakpoint
CREATE INDEX `webhook_deliveries_webhook_idx` ON `webhook_deliveries` (`webhook_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_status_idx` ON `webhook_deliveries` (`status`);
