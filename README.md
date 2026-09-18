<img src="/icons/icon.svg" alt="Mailflare" width="72" />

# Mailflare (Dmailflare)

Mailflare is a self-hosted email inbox for custom domains, built on Cloudflare.

> 面向 Agent / AI 的自动化部署指南，请阅读 **[AGENTS.md](AGENTS.md)** —— 包含一键初始化脚本、Token 权限清单、Secrets 清单与常见报错对照表。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aibochinese001/Dmailflare-open-worker)

Thanks to mailflare sponsors. Want to support the project? Drop [@hieuSSR](https://x.com/hieuSSR) a message

## What you can do

- Connect domains and set up Cloudflare Email Routing from the dashboard.
- Create personal and shared mailboxes with delegated access.
- Send and receive email with attachments, rich formatting, signatures, and automatic replies.
- Organize mail with search, custom folders, stars, snoozing, archive, spam, and trash.
- Create routing rules to store, forward, reject, or categorize incoming messages.
- Get real-time inbox updates and new-message notifications.
- Import and export mail, manage contacts, and block unwanted senders.
- Manage accounts, permissions, API keys, webhooks, audit logs, and database backups.

## How it works

Mailflare runs in your Cloudflare account. Email Routing delivers incoming messages to the app, while Cloudflare's email service handles outgoing messages. Your mail data stays in your own D1 database and attachments are stored in your own R2 bucket.

## How much does it cost?

You can setup Mailflare and receive email for free

A [Paid Worker](https://developers.cloudflare.com/workers/platform/pricing/) plan ($5/month) is required to send email (and it's recommend to have a smooth experience)

## Deploy

Getting started takes three steps:

1. **Deploy the app.** Click **Deploy to Cloudflare** and keep the app name as `mailflare`. The app will not work correctly under another Worker name.
2. **Complete setup.** Open the deployed app and follow `/setup` to check the installation and create your admin account.
3. **Connect your domain.** Add a domain managed by the same Cloudflare account. Mailflare configures its email routing and helps you create the first mailbox.

⚠️ IMPORTANT: **`CF_TOKEN` is required during deployment**. Create a scoped [Cloudflare API token with the following permissions](https://github.com/hieunc229/mailflare/issues/24#issuecomment-5523686105) for the domains you want to connect.
- All accounts - Email Sending:Edit, DNS Settings:Edit, Email Routing Addresses:Edit
- All zones - DNS Settings:Edit, Email Routing Rules:Edit, Zone Settings:Edit, DNS:Edit

See the [deployment guide](docs/deployment.md) for required permissions, manual deployment, backups, and updates.

### Self-host with Docker instead

Mailflare also runs as one container on any server, with SQLite and local files in place of D1 and R2, a built-in SMTP listener for inbound mail (or a small Cloudflare relay Worker if you want to keep MX on Cloudflare), and any SMTP relay or Cloudflare Email Sending for outbound.

```bash
cp .env.docker.example .env.docker
docker compose up -d --build
```

See [docs/self-hosting.md](docs/self-hosting.md).

## Local development

```bash
cp .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm run dev
```

Add your Cloudflare credentials to `.dev.vars`, then open [http://localhost:3000](http://localhost:3000). For sample local data, run `npm run db:seed` while the development server is running.

## Documentation

- [Deployment and configuration](docs/deployment.md)
- [API and integrations](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

See [LICENSE](LICENSE).
