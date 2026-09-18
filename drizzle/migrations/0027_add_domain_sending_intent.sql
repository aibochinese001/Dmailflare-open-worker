ALTER TABLE `domains` ADD `sending_requested` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `domains`
SET `sending_requested` = true
WHERE `sending_enabled` = true OR `sending_subdomain_tag` IS NOT NULL;
