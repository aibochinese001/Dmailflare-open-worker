#!/usr/bin/env node
/**
 * Deterministic one-shot setup for Mailflare (Dmailflare) on Cloudflare Workers.
 *
 * Steps:
 *   1. Check `wrangler` login.
 *   2. Create (or reuse) the D1 database `mailflare` and backfill its id into
 *      wrangler.jsonc (replaces REPLACE_WITH_D1_DATABASE_ID).
 *   3. Create (or reuse) the R2 bucket `mailflare-raw`.
 *   4. Create (or reuse) the queues `mailflare-inbound` / `mailflare-outbound`.
 *   5. Print the next commands: apply D1 migrations and set the secrets.
 *
 * Usage:  npm run setup
 *         node scripts/setup.mjs --json   # machine-readable output
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WRANGLER = join(ROOT, "wrangler.jsonc");
const D1_NAME = "mailflare";
const R2_NAME = "mailflare-raw";
const QUEUES = ["mailflare-inbound", "mailflare-outbound"];
const PLACEHOLDER_D1 = "REPLACE_WITH_D1_DATABASE_ID";

const jsonMode = process.argv.includes("--json");
const out = [];
function log(msg) {
  if (!jsonMode) console.log(msg);
  out.push(msg);
}
function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", ...opts });
}
function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

// ---------- 1. login check ----------
log("→ Step 1/5: verifying wrangler login…");
let whoami = "";
try {
  whoami = sh("npx wrangler whoami", { env: { ...process.env, NO_COLOR: "1" } });
} catch {
  fail("Not logged in. Run `npx wrangler login` first (or set CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID).");
}
if (!/┌|└|user|account|✓|email|@/i.test(whoami) && !/Successfully validated/i.test(whoami)) {
  fail("wrangler login check failed. Run `npx wrangler login` and retry.");
}
log("   login OK.");

// ---------- 2. D1 ----------
log("→ Step 2/5: ensuring D1 database…");
let d1Id = "";
try {
  const list = sh(`npx wrangler d1 list`, { env: { ...process.env, NO_COLOR: "1" } });
  const match = list.match(new RegExp(`([0-9a-f-]{36})\\s+\\|\\s+${D1_NAME}\\s`, "i"));
  if (match) {
    d1Id = match[1];
    log(`   reusing existing D1 "${D1_NAME}" (${d1Id}).`);
  }
} catch {
  // list failed; try create below
}
if (!d1Id) {
  try {
    const created = sh(`npx wrangler d1 create ${D1_NAME}`, { env: { ...process.env, NO_COLOR: "1" } });
    const match = created.match(/database_id\s*=\s*"([0-9a-f-]{36})"/i) || created.match(/"id"\s*:\s*"([0-9a-f-]{36})"/i);
    if (!match) {
      fail(`Could not parse D1 create output:\n${created}`);
    }
    d1Id = match[1];
    log(`   created D1 "${D1_NAME}" (${d1Id}).`);
  } catch (e) {
    fail(`Could not create D1 database: ${e.message}`);
  }
}

// ---------- backfill wrangler.jsonc ----------
let cfg = readFileSync(WRANGLER, "utf8");
if (cfg.includes(PLACEHOLDER_D1)) {
  cfg = cfg.split(PLACEHOLDER_D1).join(d1Id);
  writeFileSync(WRANGLER, cfg);
  log("   backfilled database_id into wrangler.jsonc.");
} else if (cfg.includes(d1Id)) {
  log("   database_id already set in wrangler.jsonc.");
} else {
  fail("wrangler.jsonc has neither the placeholder nor this database id — inspect manually.");
}

// ---------- 3. R2 bucket ----------
log("→ Step 3/5: ensuring R2 bucket…");
try {
  sh(`npx wrangler r2 bucket create ${R2_NAME}`, { env: { ...process.env, NO_COLOR: "1" } });
  log(`   ensured R2 bucket "${R2_NAME}".`);
} catch (e) {
  const msg = e.stderr || e.message;
  if (/already exists|already created/i.test(msg)) log(`   R2 bucket "${R2_NAME}" already exists.`);
  else fail(`Could not create R2 bucket: ${msg}`);
}

// ---------- 4. Queues ----------
for (const q of QUEUES) {
  log(`→ Step 4/5: ensuring queue "${q}"…`);
  try {
    sh(`npx wrangler queues create ${q}`, { env: { ...process.env, NO_COLOR: "1" } });
    log(`   ensured queue "${q}".`);
  } catch (e) {
    const msg = e.stderr || e.message;
    if (/already exists|already created|already/i.test(msg)) log(`   queue "${q}" already exists.`);
    else fail(`Could not create queue "${q}": ${msg}`);
  }
}

// ---------- 5. next steps ----------
log("→ Step 5/5: D1 migrations & secrets…");
log("");
log("Next steps (run in order):");
log("  1. Apply D1 migrations:");
log("     npm run db:migrate:remote");
log("  2. Set runtime secrets (never commit real values):");
log("     npx wrangler secret put CF_TOKEN");
log("     npx wrangler secret put TURNSTILE_SECRET_KEY   # optional");
log("  3. Build & deploy:");
log("     npm run deploy");
log("");
log("Done. D1 id backfilled: " + d1Id);

if (jsonMode) {
  console.log(JSON.stringify({ ok: true, d1Id, databaseName: D1_NAME, r2: R2_NAME, queues: QUEUES }));
}
