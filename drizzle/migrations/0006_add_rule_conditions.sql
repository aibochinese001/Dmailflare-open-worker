ALTER TABLE `routing_rules` ADD `match_field` text DEFAULT 'email' NOT NULL;
--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `match_operator` text DEFAULT 'contains' NOT NULL;
--> statement-breakpoint
ALTER TABLE `routing_rules` ADD `match_value` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE `routing_rules`
SET `match_value` = `pattern`
WHERE `match_value` = '';
