# Troubleshooting

## Cloudflare error 9109: Invalid access token

The Deploy to Cloudflare flow can deploy the Worker, but its deployment token is not exposed to Mailflare at runtime. Create a separate Cloudflare API token and set it as `CF_TOKEN`.

Verify the token:

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer <CF_TOKEN>"
```

The response should report `success: true` and an active status. Check that:

- `CF_TOKEN` contains the token secret, not its ID.
- The value does not include the word `Bearer`.
- The token is currently valid and its IP restrictions allow the Worker.
- You redeployed after changing Cloudflare variables or secrets.

If you use a legacy Global API Key, set `CF_EMAIL` and `CF_API_KEY` instead of placing it in `CF_TOKEN`.

## Cloudflare error 10000 on Email Routing

Update the token so it can read the zone and manage its DNS, Email Routing settings, and Email Routing rules. The recommended scoped permissions are listed in the [deployment guide](deployment.md#required-configuration).

## D1 error 7404: Database could not be found

D1 database IDs belong to a specific Cloudflare account. This error commonly means `wrangler.jsonc` contains an ID copied from another account.

For a reusable one-click deployment repository, remove the committed `database_id` and keep only `database_name`. Cloudflare can then provision the database in the target account.

For remote migrations after the first deployment:

1. Open the Worker's **Settings → Bindings** page in Cloudflare.
2. Open the `DB` D1 binding and copy its database ID.
3. Add that ID to your local `wrangler.jsonc`.
4. Run `npm run db:migrate:remote`.

Do not commit that account-specific ID to a reusable public repository.

## Scheduled backups are not running

Deploy the complete Worker with `npm run deploy`. A local Next.js server or a source-only update does not provision the cron trigger declared in `wrangler.jsonc`.

Also confirm that automatic backups are enabled under **Admin → Backups** and that the Worker has its `DB` and `BUCKET` bindings.

## Inbound mail is not arriving

Confirm that:

- The deployed Worker is named `mailflare`.
- `services[].service` in `wrangler.jsonc` is also `mailflare`.
- Email Routing is enabled for the domain in Cloudflare.
- The mailbox has an Email Routing rule pointing to the Worker.
