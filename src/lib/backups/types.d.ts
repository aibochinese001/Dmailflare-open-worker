export type BackupScheduleType = "daily" | "weekly" | "monthly";

export type DatabaseBackupTable = "users" | "domains" | "mailboxes" | "mailbox_access" | "contacts" | "folders" | "api_keys" | "messages" | "message_attachments" | "outbound_jobs" | "routing_rules" | "webhooks" | "webhook_deliveries" | "sessions" | "audit_logs" | "backup_settings" | "backups" | "app_settings" | "license_settings" | "email_templates" | "calendar_events" | "auto_reply_deliveries" | "spam_token_stats" | "spam_reputation" | "spam_feedback" | "mailbox_aliases" | "password_reset_tokens" | "mfa_recovery_codes" | "login_challenges";
export type DatabaseRecord = Record<string, string | number | null>;
export type DatabaseBackupDocument = { format: "mailflare-database-backup"; version: 1; createdAt: string; tables: Record<DatabaseBackupTable, DatabaseRecord[]>; };
