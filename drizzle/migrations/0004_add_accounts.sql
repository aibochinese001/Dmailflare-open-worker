ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `created_by_user_id` text REFERENCES `users`(`id`) ON DELETE set null;
--> statement-breakpoint
UPDATE `users`
SET `role` = 'admin'
WHERE `id` = (
	SELECT `id`
	FROM `users`
	ORDER BY `created_at` ASC
	LIMIT 1
);
--> statement-breakpoint
CREATE INDEX `users_created_by_idx` ON `users` (`created_by_user_id`);
