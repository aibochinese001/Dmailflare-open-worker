ALTER TABLE `messages` ADD `text_body` text;
ALTER TABLE `messages` ADD `html_body` text;
ALTER TABLE `messages` ADD `raw_r2_key` text;
UPDATE `messages`
SET
  `text_body` = (SELECT `text_body` FROM `message_bodies` WHERE `message_bodies`.`message_id` = `messages`.`id`),
  `html_body` = (SELECT `html_body` FROM `message_bodies` WHERE `message_bodies`.`message_id` = `messages`.`id`),
  `raw_r2_key` = (SELECT `raw_r2_key` FROM `message_bodies` WHERE `message_bodies`.`message_id` = `messages`.`id`);
DROP TABLE `message_bodies`;
