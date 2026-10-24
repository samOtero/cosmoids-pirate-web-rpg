# Password recovery

Cosmoids uses Better Auth's password-reset endpoints and Resend for delivery.
Passwords, account IDs and reset tokens stay under the API's control. This does
not add a new authentication provider or require a database migration: tokens use
the existing Better Auth `verification` table.

## Player flow

1. Open **Log in → Forgot password?** and enter the account email.
2. The game shows the same confirmation whether the address exists or not.
3. A registered account receives a plain-text email with a single-use link that
   expires in 30 minutes. Requesting a link does not change the password.
4. The link opens `/reset-password` on the requesting game's trusted origin.
   This standalone page supports portrait and landscape without game overlays.
5. Enter and confirm a new password of 12–128 characters. On success, all existing
   account sessions are revoked. Return to the game and log in normally.

Missing, expired and used links offer another reset request. Password mismatches
are caught before submitting. Network failures never trigger automatic retries.
Recovery never uploads, deletes, or changes guest save data.

## Resend setup

1. Create a [Resend account](https://resend.com/) and add a sending domain, such as
   `mail.cosmoids-td.com`.
2. Add the exact DNS records Resend supplies in Porkbun, then wait for domain
   verification. Do not change the game's existing A/CNAME records or nameservers.
   Sending-only verification does not require creating a mailbox. See
   [Resend's domain guide](https://resend.com/docs/dashboard/domains/introduction).
3. Keep open/click tracking disabled for recovery emails so links are not rewritten
   through a tracking service.
4. Create a sending API key restricted to that sending domain.
5. Add these **server-only** values to
   `/home/deploy/.config/cosmoids/api.env` on the VPS:

   ```dotenv
   RESEND_API_KEY=<your-private-sending-key>
   PASSWORD_RESET_FROM="Cosmoids <accounts@mail.cosmoids-td.com>"
   ```

   Keep the real key out of source control, frontend variables, chat and logs.
   For local real-email testing, use the same names in ignored `apps/api/.env`.
   Leave both absent to disable email recovery while retaining normal login.
   A partial configuration prevents startup so a misconfigured sender cannot
   silently appear enabled.

6. Build and restart the API using [the VPS deployment steps](../../apps/api/OPERATIONS.md#deploying-api-changes),
   and deploy the web changes to Vercel. No new Vercel variables are needed.
   `AUTH_TRUSTED_ORIGINS` must already include the game domain making the request.
7. Request a link for an account you control on the deployed game. Verify delivery,
   password change, old-session rejection, new-password login and link reuse
   rejection. Resend accepting a message does not prove inbox delivery; inspect
   its dashboard for delivery failures or bounces.

## Security and failure behavior

- Resend is called over HTTPS with a 10-second timeout. Delivery runs independently
  of the public response so provider latency/failure does not expose account
  existence. Pending sends are drained during graceful API shutdown. There is no
  persistent delivery queue or automatic resend; players can request another link.
- Delivery failures log only `Password reset email delivery failed`, without
  recipient, token, provider response or API key. The public confirmation means a
  request was accepted, not that the email arrived.
- Requests are limited to three per minute per resolved client IP; password reset
  attempts are limited to five. The existing database-backed counters survive
  API restarts. Trusted proxy resolution prevents forged client-IP headers.
- Reset requests accept only the exact `/reset-password` page on a configured
  trusted origin, without credentials, query strings or fragments. Foreign browser
  origins are rejected before Better Auth handles recovery POSTs.
- Emails link directly to the game with `#token=…`. Fragments are not sent in HTTP
  requests or referrers. The page removes the fragment from the current history
  entry after reading it and keeps the token only in component memory. Reloading
  the cleaned page requires reopening the email link. Opening a link does not
  consume it; successful reset does.
- The reset page uses `no-referrer`, disables indexing and excludes game analytics
  and overlays. API auth responses use `no-store` and `no-referrer`. Fastify's
  request serializer strips queries and redacts native Better Auth callback tokens.
- This implementation does not send native `/api/auth/reset-password/:token`
  links. If another client later uses those links, configure Nginx to suppress or
  redact their URLs in access logs before enabling that client.
- Email verification remains a separate feature. Requesting or completing recovery
  does not set `emailVerified`.

## Validation

```sh
pnpm typecheck:api
pnpm test:api
pnpm verify:quick
pnpm build:api
pnpm build
```

`apps/api/tests/auth.test.mjs` exercises real Better Auth/Fastify handlers with
SQLite by default, or an isolated PostgreSQL schema when
`AUTH_TEST_DATABASE_URL` is supplied. It captures test emails in memory and never
calls Resend. Transport tests verify the Resend request using a fake fetch.
Frontend tests use the real Better Auth client with controlled HTTP responses.

References: [Better Auth password recovery](https://better-auth.com/docs/authentication/email-password#request-password-reset),
[Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).
