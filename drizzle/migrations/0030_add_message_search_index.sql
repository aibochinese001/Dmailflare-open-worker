-- Full-text search over messages. An external-content FTS5 index reads its
-- text from the messages table, so bodies are not stored twice; triggers keep
-- it in step with every insert, update and delete, whichever code path writes.
CREATE VIRTUAL TABLE `messages_fts` USING fts5(
	`subject`,
	`from_addr`,
	`to_addr`,
	`cc_addr`,
	`text_body`,
	`html_body`,
	content='messages',
	content_rowid='rowid',
	tokenize='unicode61 remove_diacritics 2'
);--> statement-breakpoint
CREATE TRIGGER `messages_fts_ai` AFTER INSERT ON `messages` BEGIN
	INSERT INTO `messages_fts`(`rowid`, `subject`, `from_addr`, `to_addr`, `cc_addr`, `text_body`, `html_body`)
	VALUES (new.`rowid`, new.`subject`, new.`from_addr`, new.`to_addr`, new.`cc_addr`, new.`text_body`, new.`html_body`);
END;--> statement-breakpoint
CREATE TRIGGER `messages_fts_ad` AFTER DELETE ON `messages` BEGIN
	INSERT INTO `messages_fts`(`messages_fts`, `rowid`, `subject`, `from_addr`, `to_addr`, `cc_addr`, `text_body`, `html_body`)
	VALUES ('delete', old.`rowid`, old.`subject`, old.`from_addr`, old.`to_addr`, old.`cc_addr`, old.`text_body`, old.`html_body`);
END;--> statement-breakpoint
CREATE TRIGGER `messages_fts_au` AFTER UPDATE OF `subject`, `from_addr`, `to_addr`, `cc_addr`, `text_body`, `html_body` ON `messages` BEGIN
	INSERT INTO `messages_fts`(`messages_fts`, `rowid`, `subject`, `from_addr`, `to_addr`, `cc_addr`, `text_body`, `html_body`)
	VALUES ('delete', old.`rowid`, old.`subject`, old.`from_addr`, old.`to_addr`, old.`cc_addr`, old.`text_body`, old.`html_body`);
	INSERT INTO `messages_fts`(`rowid`, `subject`, `from_addr`, `to_addr`, `cc_addr`, `text_body`, `html_body`)
	VALUES (new.`rowid`, new.`subject`, new.`from_addr`, new.`to_addr`, new.`cc_addr`, new.`text_body`, new.`html_body`);
END;--> statement-breakpoint
INSERT INTO `messages_fts`(`messages_fts`) VALUES ('rebuild');
