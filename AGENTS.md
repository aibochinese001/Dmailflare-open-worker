# AGENTS.md — AI 部署指南（Agent 专用）

本文件面向 **AI 编码/部署 Agent**（Claude Code、Cursor、豆包等），提供在全新 Cloudflare 账号上确定性部署本项目的每一步命令。按顺序照做即可，不要猜测。

> 项目原名 `mailflare`（上游 hieunc229/mailflare），本仓库为可独立部署版本。核心 Worker 名默认 `mailflare-opc`（见 `wrangler.jsonc` 的 `name` 与 `CF_EMAIL_WORKER_NAME` 必须一致）。

---

## 0. 快速开始（给人类的 3 步）

```bash
# 1) 初始化云资源（建 D1/R2/队列，回填 database_id 到 wrangler.jsonc）
npm run setup

# 2) 应用 D1 迁移（33 条）
npm run db:migrate:remote

# 3) 设置运行时密钥
npx wrangler secret put CF_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY   # 可选

# 4) 构建并部署
npm run deploy
```

---

## 1. 前提与权限

需要 **一个 Cloudflare API Token**（部署用）和一个 **运行时 Token**（应用用），两者不同：

| Token | 用途 | 所需权限（够用即可） |
|---|---|---|
| `CLOUDFLARE_API_TOKEN`（CI/本地部署） | `wrangler deploy`、D1 迁移、创建 R2/队列 | **Workers Scripts Edit**、**Workers D1 Edit**、**Workers R2 Edit**、**Workers KV storage Edit**、**Workers Queues Edit**、**Workers AI Edit**（如启用）、Account Settings Read |
| `CLOUDFLARE_ACCOUNT_ID` | 指定账号 | 在 dashboard 右侧栏可见 |
| `CF_TOKEN`（运行时，写入 `wrangler secret put`） | 应用调用 Zones / Email Routing / Email Sending API | **Zone Read**、**Email Routing Edit**、**Email Routing Rules Write**（+ **Email Sending Edit** 若要发信） |

> 不要把一个 Token 同时当部署 token 和运行时 token 用。部署 token 不会透传给 Worker 运行时。

---

## 2. Secrets 清单

| 变量 | 必填 | 用途 | 哪里获取 / 不填后果 |
|---|---|---|---|
| `CF_TOKEN` | ✅ 必填 | 运行时调用 Cloudflare API（域名、路由、发信） | Cloudflare → My Profile → API Tokens；不填则域名接入与发信全部失败 |
| `TURNSTILE_SECRET_KEY` | 可选 | 登录/注册人机校验 | Cloudflare Turnstile 面板；不填则跳过校验（功能降级，不崩溃） |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 可选 | Turnstile 站点公钥（构建期） | 与上者成对；不填时前端不渲染验证码 |
| `CF_EMAIL_WORKER_NAME` | ✅ | Email Routing 规则指向的 Worker 名 | 必须与 `wrangler.jsonc` 的 `name` 一致 |
| `GITHUB_UPDATE_TOKEN` | 可选 | 管理后台「更新」按钮触发 GitHub Actions | Fine-grained PAT（Actions:write, Contents:read）；不填则更新按钮不可用 |
| `GITHUB_UPDATE_REPO` | 可选 | `owner/repo` | 不填则更新按钮不可用 |
| `GITHUB_UPDATE_REF` | 可选 | 更新分支 | 缺省用仓库默认分支 |
| `CF_EMAIL` / `CF_API_KEY` | 可选（旧式） | Global API Key 认证替代 `CF_TOKEN` | 仅老账号；二选一 |
| `INBOUND_WEBHOOK_SECRET` | 可选（自托管） | Cloudflare relay → 本服务器的签名密钥 | 仅 Docker 部署用 |
| `CF_ACCOUNT_ID` | 可选（自托管发信） | Email Sending REST API | 仅 Docker 部署用 |

`.dev.vars.example` 为本地开发模板，复制为 `.dev.vars` 后填入真实值。

---

## 3. 常见报错对照表

| 现象 / 报错 | 原因 | 解决 |
|---|---|---|
| `Error 9109: Invalid access token` | 运行时 `CF_TOKEN` 无效 | `wrangler secret put CF_TOKEN` 重新设置；确认粘贴的是 token 密文而非 ID，且不含 `Bearer` |
| `D1 error 7404: Database could not be found` | `wrangler.jsonc` 里的 `database_id` 属于别的账号/不存在 | 运行 `npm run setup` 重新创建并回填，或从 Cloudflare 面板 DB 绑定复制真实 id |
| `could not find binding "DB"` / migration 报错 | D1 未创建或未迁移 | `npm run setup` → `npm run db:migrate:remote` |
| 部署后域名无法接入 / 路由不生效 | `CF_EMAIL_WORKER_NAME` 与 Worker 名不一致 | 三处必须一致：`wrangler.jsonc` 的 `name`、`CF_EMAIL_WORKER_NAME`、`services[].service`（`WORKER_SELF_REFERENCE`） |
| `Queues` 不存在 | 队列未创建 | `npx wrangler queues create mailflare-inbound` / `mailflare-outbound`（或重跑 `npm run setup`） |
| R2 上传失败 | bucket 未创建 | `npx wrangler r2 bucket create mailflare-raw` |
| `send_email` 需要付费计划 | 免费计划不支持出站邮件 | 升级 Paid Worker（$5/月）；只收信可免费 |
| 后台「更新」按钮报 GITHUB 错误 | `GITHUB_UPDATE_TOKEN` / `GITHUB_UPDATE_REPO` 未配置 | 按 secrets 表补齐 |
| `cron trigger` 不执行备份 | 只部署了 Next.js 而非完整 Worker | 必须 `npm run deploy`（完整 Worker 含 scheduled handler），不要只 `next build` |

---

## 4. 本地开发

```bash
cp .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm run dev          # http://localhost:3000
```

---

## 5. 结构速览（Agent 修改代码前必读）

- `worker.ts` 是 Cloudflare 入口（fetch / email / queue / scheduled），包住 OpenNext 生成的 `.open-next/worker.js`。
- `src/app/**` Next.js App Router 页面与 API 路由；`src/lib/**` 业务逻辑（邮箱、域名、路由、JMAP、备份、垃圾邮件）。
- `src/db/schema/index.ts` 是 D1 schema 唯一来源；迁移在 `drizzle/migrations/`。
- **双迁移陷阱**：`src/lib/setup/migration.ts` 内联了一份完整 schema SQL（初始化空库用）。新增迁移时必须**同时**更新该文件里的 `INITIAL_SCHEMA_SQL` 和 `MIGRATION_NAMES`，否则 setup 路径与 wrangler 迁移会不一致。
- 自托管（Docker）运行在 `server/`；`npm run build:node` 产出 `dist/server.mjs`。
- MCP 服务器在 `mcp-server/`（独立 Worker，部署前把 `MAILFLARE_BASE_URL` 改成你的真实地址）。
- `cloudflare-env.d.ts` 由 `npm run cf-typegen` 生成，勿手改。

## 6. 安全检查

```bash
node scripts/formal_secret_scan.mjs   # 开源前必跑，0 命中才算干净
```
