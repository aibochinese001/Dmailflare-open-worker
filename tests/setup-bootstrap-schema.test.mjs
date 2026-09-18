import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/setup/migration.ts"), "utf8");

function migrationNames() {
	const match = src.match(/const MIGRATION_NAMES = \[([\s\S]*?)\]\;/);
	assert.ok(match, "MIGRATION_NAMES array not found");
	return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function initialSchemaSql() {
	const match = src.match(/const INITIAL_SCHEMA_SQL = `([\s\S]*?)`\;/);
	assert.ok(match, "INITIAL_SCHEMA_SQL not found");
	return match[1];
}

test("bootstrap records migrations represented in the current schema so later deploys do not re-apply them", () => {
	const names = migrationNames();
	for (const name of [
		"0013_add_license_settings.sql",
		"0021_add_mailbox_signature.sql",
		"0022_add_mailbox_auto_reply.sql",
		"0027_add_domain_sending_intent.sql",
		"0029_add_spam_protection.sql",
	]) {
		assert.ok(names.includes(name), `MIGRATION_NAMES is missing ${name}`);
	}
});

test("fresh bootstrap schema accepts the current Drizzle mailbox and license inserts", () => {
	const sql = initialSchemaSql();
	const mailboxCreate = sql.match(/CREATE TABLE IF NOT EXISTS mailboxes \(([\s\S]*?)\)\;/);
	assert.ok(mailboxCreate, "mailboxes CREATE TABLE not found");
	assert.match(mailboxCreate[1], /\bsignature\b/);
	assert.match(mailboxCreate[1], /\bauto_reply_enabled\b/);
	assert.match(mailboxCreate[1], /\bauto_reply_subject\b/);
	assert.match(mailboxCreate[1], /\bauto_reply_body\b/);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS license_settings \(/);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS auto_reply_deliveries \(/);
	assert.match(sql, /\bspam_protection_enabled\b/);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS spam_token_stats \(/);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS spam_reputation \(/);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS spam_feedback \(/);
	const domainCreate = sql.match(/CREATE TABLE IF NOT EXISTS domains \(([\s\S]*?)\)\;/);
	assert.ok(domainCreate, "domains CREATE TABLE not found");
	assert.match(domainCreate[1], /\bsending_requested\b/);

	const py = `
import sqlite3, sys
sql = sys.stdin.read()
db = sqlite3.connect(":memory:")
for stmt in sql.split(";"):
    s = stmt.strip()
    if s:
        db.execute(s)
db.execute("INSERT INTO users (id,email,password_hash,name,created_at) VALUES ('u','a@b.c','x','n',1)")
db.execute("INSERT INTO domains (id,user_id,hostname,zone_id,created_at) VALUES ('d','u','ex.com','z',1)")
db.execute("""
INSERT INTO mailboxes (
  id, user_id, domain_id, local_part, display_name,
  signature, auto_reply_enabled, auto_reply_subject, auto_reply_body, created_at
) VALUES ('m','u','d','admin','admin','sig',0,'Out of office','',1)
""")
db.execute("INSERT INTO license_settings (id, instance_id, updated_at) VALUES ('default','inst',1)")
db.execute("INSERT INTO auto_reply_deliveries (id, mailbox_id, recipient, sent_at) VALUES ('ar','m','x@y.z',1)")
print("ok")
`;
	const result = spawnSync("python3", ["-c", py], { input: sql, encoding: "utf8" });
	assert.equal(result.status, 0, result.stderr + result.stdout);
	assert.match(result.stdout, /^ok$/m);
});
