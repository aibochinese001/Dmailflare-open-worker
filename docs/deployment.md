# Deployment and configuration

This guide covers Cloudflare deployment, runtime configuration, database backups, and application updates.

## Overview

Set up Mailflare in three steps:

1. **Deploy the app:** use the Deploy to Cloudflare button, set the app name to `mailflare`, and provide the required `CF_TOKEN`.
2. **Complete setup:** open the deployed app and follow `/setup` to check the installation and create the first admin account.
3. **Connect your domain:** add a domain managed by the same Cloudflare account. Mailflare configures email routing and, when available and selected, email sending before helping you create the first mailbox.

The Worker name must remain `mailflare`. Before starting, create the required `CF_TOKEN` with **Zone Read**, **Email Routing Edit**, and **Email Routing Rules Write** permissions for every domain you plan to connect. Add **Email Sending Edit** when Mailflare should send email; it is optional for receive-only domains.

## Step 1: Deploy mailflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hieunc229/mailflare)

1. Click **Deploy to Cloudflare** above and sign in to Cloudflare if prompted.
2. Choose the Cloudflare account that owns the domain you want to use.
3. Set the app name to exactly `mailflare`. Do not rename it.
4. Add `CF_TOKEN` when Cloudflare asks for the app's runtime variables or secrets.
5. Start the deployment and wait for Cloudflare to finish provisioning and deploying the Worker.

### Required configuration

Mailflare requires this runtime value:

- `CF_TOKEN` — a scoped Cloudflare API token with **Zone Read**, **Email Routing Edit**, and **Email Routing Rules Write** access for the domains you will connect. Add **Email Sending Edit** to enable outbound mail. This is separate from the token Cloudflare uses to deploy the app.

Paste only the token secret into `CF_TOKEN`. Do not include the word `Bearer` and do not use the token ID. The token must belong to the same Cloudflare account as the domains you connect.

## Step 2: Complete mailflare setup

1. Open the URL of the deployed `mailflare` Worker.
2. Go to `/setup` if Mailflare does not take you there automatically.
3. Let Mailflare check the required Cloudflare configuration and initialize the empty D1 database.
4. Create the first admin account when prompted.

The setup page initializes only a new, empty database. It never applies later migrations to an existing database.

## Step 3: Connect your primary domain and create an account

1. Enter a domain that already uses Cloudflare DNS on the same account as `CF_TOKEN`.
2. Continue while Mailflare enables Email Routing and configures the required routing and sending DNS.
3. Choose the address for your first mailbox and finish setup.
4. Open the inbox and send a test message to the new address.

To connect more domains later, open **Admin → Domains**, select **New domain**, and enter the hostname. Mailflare configures Email Routing and Email Sending automatically.

Your inbox should be ready to send and receive emails

---

## Manual deployment

Install dependencies, configure the Cloudflare bindings in `wrangler.jsonc`, and run:

```bash
npm install
npm run deploy:local
```

The local deploy command builds the OpenNext application, applies pending D1 migrations, and uploads the complete Worker with Wrangler. The complete Worker is required because `worker.ts` also handles inbound email, queues, scheduled backups, and the real-time Durable Object.

To migrate an existing remote D1 database before deploying, use:

```bash
npm run db:migrate:remote
```

Remote migrations require the target account's `database_id` in your local `wrangler.jsonc`. Do not commit an account-specific database ID to a reusable repository.

## Database backups

Mailflare exports its D1 records as JSON and stores the backup files in the configured R2 bucket. A cron trigger in `wrangler.jsonc` runs daily at 02:00 UTC and applies the schedule selected under **Admin → Backups**. Manual backups run the same record export directly from the admin API.

Deploy the complete Worker with `npm run deploy` whenever the cron trigger is added or changed.

After upgrading an existing installation and confirming the cron trigger is active, the old Workflow can be removed with `npx wrangler workflows delete mailflare-database-backup`. Deleting it also removes its historical Workflow instances; backup files in R2 and rows in Mailflare's backup history are unaffected.

## Updating Mailflare

The **Update Mailflare** button in the admin dashboard dispatches `.github/workflows/update.yml` in the installation repository. The workflow merges the latest upstream source, applies pending D1 migrations, and pushes the updated source. A connected Cloudflare Git integration can then build and deploy the change.

Configure these Worker values:

- `GITHUB_UPDATE_TOKEN` — a fine-grained GitHub token for the installation repository with Actions write permission.
- `GITHUB_UPDATE_REPO` — the installation repository in `owner/repository` format.
- `GITHUB_UPDATE_REF` — an optional update branch. The repository's default branch is used when omitted.

Configure these GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare token allowed to read and migrate D1.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.
- `MAILFLARE_UPSTREAM_TOKEN` — required only when the upstream repository is private.

Optional repository variables:

- `MAILFLARE_UPSTREAM_REPOSITORY` — the upstream repository. Defaults to `hieunc229/mailflare`.
- `MAILFLARE_UPSTREAM_BRANCH` — the upstream branch. Defaults to `main`.

If an older installation contains a failing updater, copy the latest `.github/workflows/update.yml` into that installation once. An updater that cannot read upstream cannot update its own workflow.

## Branding license

Activate a purchased Pro or Team key from **Admin → Licenses**. Mailflare sends the key to Paymug and stores only a one-way hash and the activation state. Apply all D1 migrations before activating a license.
