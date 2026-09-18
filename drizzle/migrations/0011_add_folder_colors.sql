ALTER TABLE `folders` ADD `color` text DEFAULT '#2563eb' NOT NULL;
ALTER TABLE `contacts` ADD `blocked` integer DEFAULT false NOT NULL;
ALTER TABLE `mailboxes` ADD `avatar_key` text;