CREATE TABLE `license_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`instance_id` text NOT NULL,
	`instance_url` text,
	`license_key_hash` text,
	`plan` text DEFAULT 'community' NOT NULL,
	`state` text DEFAULT 'inactive' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`activated_at` integer,
	`validated_at` integer,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `license_settings_instance_id_unique` ON `license_settings` (`instance_id`);
