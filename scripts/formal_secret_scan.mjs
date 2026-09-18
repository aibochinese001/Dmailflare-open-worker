#!/usr/bin/env node
/**
 * Formal secret scan for open-sourcing.
 *
 * Scans the repository for high-risk secret patterns, excluding build output,
 * node_modules and files that are intentionally fake/example data.
 *
 * Usage:
 *   node scripts/formal_secret_scan.mjs
 *   node scripts/formal_secret_scan.mjs --verbose   # print every match with context
 *
 * Exit code 0 = clean (no high-risk findings).
 * Exit code 1 = at least one high-risk finding.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MAX_FILE_BYTES = 4 * 1024 * 1024; // skip > 4MB files

// Directory names (relative) that are never scanned.
const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  ".workbuddy",
  ".vscode",
  ".idea",
  "dist",
  "build",
  "out",
  "coverage",
  "drizzle/migrations/meta",
]);

// File names that are never scanned (regardless of location).
const EXCLUDE_FILES = new Set([
  "package-lock.json",
  "package.json",
  "cloudflare-env.d.ts",
  "tsconfig.tsbuildinfo",
  "LICENSE",
]);

// Fake / example email domains; an "email:password" pair using these is not a leak.
const FAKE_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "example.test",
  "test.com",
  "acme.test",
  "northwind.test",
  "contoso.test",
  "globex.test",
  "unknown-sender.test",
  "fake-bank.test",
  "vendor.test",
  "customer.test",
  "umbrella.test",
  "invalid.test",
  "partner.test",
  "northline.dev",
  "halcyon.tools",
  "marketmesh.io",
  "mailflare.dev",
  "mail.dev",
]);

// Base64-looking strings that are NOT secrets (constant character sets etc.).
const BASE64_CHARSETS = new Set([
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
]);

const SCAN_RULES = [
  {
    name: "cloudflare-api-token (cfut_)",
    severity: "high",
    re: /\bcfut_[A-Za-z0-9_-]{16,}/g,
  },
  {
    name: "cloudflare-api-token-env",
    severity: "high",
    re: /\bCLOUDFLARE_API_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: "openai-style key (sk-)",
    severity: "high",
    re: /\bsk-[A-Za-z0-9_-]{16,}/g,
  },
  {
    name: "github personal token (ghp_)",
    severity: "high",
    re: /\bghp_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "github fine-grained token (github_pat_)",
    severity: "high",
    re: /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  },
  {
    name: "bearer token literal",
    severity: "high",
    re: /\bBearer\s+[A-Za-z0-9_\-.]{20,}/g,
  },
  {
    name: "aws access key",
    severity: "high",
    re: /\bAKIA[0-9A-Z]{16}/g,
  },
  {
    name: "slack token",
    severity: "high",
    re: /\bxox[baprs]-[A-Za-z0-9-]{20,}/g,
  },
  {
    name: "private key PEM",
    severity: "high",
    re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    name: "uuid used as secret (heuristic: 8-4-4-4-12)",
    severity: "medium",
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  },
  {
    name: "email:password pair",
    severity: "high",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\s*[:|]\s*[^\s]{6,}/g,
  },
  {
    name: "assignment of long base64 / hex value",
    severity: "medium",
    re: /\b(secret|token|api[_-]?key|passwd|password|pwd)\s*[:=]\s*["']([A-Za-z0-9+/=_-]{24,})["']/gi,
  },
  {
    name: "workers.dev hostname (real deployment)",
    severity: "medium",
    re: /\b[a-z0-9-]+\.workers\.dev\b/g,
  },
  {
    name: "hardcoded password assignment",
    severity: "medium",
    re: /\b(password|passwd)\s*[:=]\s*["'][^"']{6,}["']/gi,
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (
      EXCLUDE_DIRS.has(rel) ||
      [...EXCLUDE_DIRS].some((d) => rel === d || rel.startsWith(d + "/"))
    )
      continue;
    if (EXCLUDE_FILES.has(entry)) continue;
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(abs, out);
    else if (st.size > 0 && st.size <= MAX_FILE_BYTES) out.push(abs);
  }
  return out;
}

function isBinary(buf) {
  const sample = buf.subarray(0, 1024);
  return sample.includes(0x00);
}

function looksLikeBase64Constant(value) {
  return BASE64_CHARSETS.has(value);
}

const verbose = process.argv.includes("--verbose");
const files = walk(ROOT);
const findings = [];
const scanned = [];

for (const abs of files) {
  const buf = readFileSync(abs);
  if (isBinary(buf)) continue;
  const text = buf.toString("utf8");
  scanned.push(relative(ROOT, abs));
  const lines = text.split("\n");

  for (const rule of SCAN_RULES) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        // Filter base64 constant charsets.
        if (
          rule.name === "assignment of long base64 / hex value" &&
          looksLikeBase64Constant(m[2])
        ) {
          continue;
        }
        // Filter fake email:password pairs (fixtures).
        if (rule.name === "email:password pair") {
          const email = m[0].split(/[:|]/)[0];
          const domain = email.split("@")[1] || "";
          if (FAKE_EMAIL_DOMAINS.has(domain.toLowerCase())) continue;
        }
        // Filter UUIDs that are known product ids / non-secrets.
        if (rule.name === "uuid used as secret (heuristic: 8-4-4-4-12)") {
          const uuid = m[0].toLowerCase();
          // License product ids (Paymug) are identifiers, not secrets.
          if (
            uuid === "ebafa58f-af9f-4b8a-a48d-6cfd44dd2053" ||
            uuid === "6e42b54c-3221-4f8f-93a7-bab494f9e224"
          )
            continue;
          // Rate limit namespace id "1001" style short values never match anyway.
        }
        // Filter demo seed password.
        if (
          rule.name === "hardcoded password assignment" &&
          /demo-password-change-me/.test(line)
        )
          continue;

        const snippet = line.slice(Math.max(0, m.index - 30), m.index + m[0].length + 60);
        findings.push({
          file: relative(ROOT, abs),
          line: i + 1,
          rule: rule.name,
          severity: rule.severity,
          match: m[0].length > 60 ? m[0].slice(0, 57) + "..." : m[0],
          snippet: snippet.trim(),
        });
      }
    }
  }
}

console.log(`Scanned ${scanned.length} files under ${ROOT}`);
if (findings.length === 0) {
  console.log("✅ No high-risk secret patterns found.");
  process.exit(0);
}

console.log(`⚠️  ${findings.length} finding(s):\n`);
for (const f of findings) {
  console.log(`[${f.severity.toUpperCase()}] ${f.file}:${f.line} (${f.rule})`);
  console.log(`    match: ${f.match}`);
  if (verbose) console.log(`    context: ${f.snippet}`);
  console.log("");
}
process.exit(1);
