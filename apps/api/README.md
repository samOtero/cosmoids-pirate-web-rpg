# Cosmoids API

Fastify runs on `127.0.0.1:3001`, behind Nginx in production. Postgres stores
accounts and sessions; Better Auth handles email/password authentication.

For the current VPS file locations, environment settings, Nginx/systemd
configuration, deployment steps, and troubleshooting commands, see the
[API operations reference](OPERATIONS.md).

This is the first account-development step. Email addresses are **unverified**.
Email verification and password recovery still need to be
connected before opening accounts to players. The browser account UI is described
in [the game account guide](../../docs/development/GAME_ACCOUNTS.md). Creature ownership, cloud saves,
trading, and shiny validation are separate game features.

The account-save database and profile API are documented in
[the game save guide](../../docs/development/GAME_SAVES.md). It adds versioned
game migrations using `node-pg-migrate` for profiles, individual creatures, and account trade-box
metadata, plus authenticated profile listing, loading, creation, revision-checked
saving, and deletion. Game UI integration and trade-box transfer endpoints are
the next stage.

The game also exports a view-only `/admin` panel for inspecting cloud accounts,
profiles and creatures. Its `/api/admin/*` reads require a verified session and
an exact ID/email pair in the private `ADMIN_ACCOUNTS` setting; access is disabled
by default. See [admin panel setup](../../docs/development/ADMIN_PANEL.md).

## How the code fits together

- `src/auth-config.ts` reads the auth secret, public API URL, and allowed website
  origins. Missing secrets and unsafe production URLs fail at startup.
- `src/auth.ts` configures Better Auth with our existing database pool. Passwords
  must contain 12–128 characters. Login and signup each allow five attempts per
  minute per resolved client IP. Counters live in Postgres and survive restarts.
- `src/auth-routes.ts` connects Fastify requests to Better Auth and forwards its
  responses, including each separate cookie header. `/api/me` uses the session
  cookie to identify the player and returns a small user object.
- `src/auth-migrate.ts` previews or explicitly applies the tables Better Auth
  needs. Starting the API does not apply migrations.
- `src/server.ts` starts the application and trusts proxy headers only from
  loopback, where Nginx connects. The auth adapter replaces its client-IP header
  with Fastify's resolved IP; players cannot choose their own rate-limit bucket.

The initial tables are `user` (identity), `account` (login credentials, including
the password hash), `session` (active logins), `verification` (temporary tokens),
and `rateLimit` (request counters). Game data will reference the user ID obtained
from a verified session, rather than an owner ID supplied by a player.

## Environment

Alongside the existing `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`:

```dotenv
BETTER_AUTH_SECRET=replace-with-a-random-secret-generated-on-the-server
BETTER_AUTH_URL=https://api.cosmoids-td.com
AUTH_TRUSTED_ORIGINS=https://staging.cosmoids-td.com
```

Generate the secret on the VPS with `openssl rand -base64 32`. Keep it in
`/home/deploy/.config/cosmoids/api.env`, owned by deploy and mode `600`. Never
commit the real environment file. Keep the secret stable across deployments.

The API's own origin is trusted automatically. For additional browser clients,
set `AUTH_TRUSTED_ORIGINS` to a comma-separated list of exact origins, for example
`https://play.example.com,https://trade.example.com`. No wildcard origins are
accepted. Production requires HTTPS.

For development, use `BETTER_AUTH_URL=http://localhost:3001` and a separate random
secret. `http://localhost:3000` is trusted by default outside production. Local
variables can live in an ignored `apps/api/.env`; run from the repo root with
`pnpm --filter @cosmoids/api exec node --env-file=.env --import tsx src/server.ts`.
The root `pnpm dev:api` command also loads that file and watches source changes.
For Docker-based local Postgres, use the local setup in the game account guide;
the root `pnpm db:up` / `pnpm db:stop` scripts manage that database.

## Endpoints

| Request                        | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `GET /health`                  | Process health                                         |
| `GET /health/db`               | Database connectivity                                  |
| `POST /api/auth/sign-up/email` | Sign up with `{ name, email, password }`               |
| `POST /api/auth/sign-in/email` | Sign in with `{ email, password }`                     |
| `POST /api/auth/sign-out`      | Sign out the session identified by the cookie          |
| `GET /api/auth/get-session`    | Better Auth session endpoint                           |
| `GET /api/me`                  | Our user endpoint; returns 401 without a valid session |

Authenticated profile endpoints are `GET /api/profiles`, `GET /api/profiles/:id`,
`POST /api/profiles`, `PUT /api/profiles/:id`, and `DELETE /api/profiles/:id`.
Save and delete requests require the expected revision; writes require a trusted
Origin. See the [save API contract](../../docs/development/GAME_SAVES.md#profile-api)
for snapshots, conflict responses, validation, and cookie handling.

Signup signs the player in automatically. The browser stores a signed session
cookie and sends it with subsequent requests. Production cookies are Secure,
HttpOnly, and use Better Auth's default SameSite protection. Use
`credentials: "include"` for browser fetches between allowed origins. Browser
origins and cookie _sites_ are different. The custom staging and API domains now
share the parent domain `cosmoids-td.com`. Use the custom staging domain for
browser login tests; the original `vercel.app` addresses are on a different site,
and allowing their origins alone does not solve third-party-cookie restrictions.
`apps/web/vercel.json` redirects the original experimental staging URL to
`staging.cosmoids-td.com`. The game calls the API directly from the custom
domain, using our existing session cookie settings. Players start with that
origin's local save storage; old saves are not migrated. Production's redirect
will be enabled after its custom domain is connected. See
[the redirect rollout steps](OPERATIONS.md#game-url-redirect-rollout).

The preferred trusted-origin configuration lists custom game domains. An
existing legacy staging entry can be removed after its redirect is verified.
The API remains behind Nginx, with IP-based rate limits using Fastify's resolved
client address.

Keep Better Auth's origin and CSRF checks enabled. Nginx should continue
overwriting `X-Real-IP` and setting `X-Forwarded-For` with
`$proxy_add_x_forwarded_for`, as in the existing VPS configuration.

## Checks

From the repository root:

```bash
pnpm typecheck:api
pnpm build:api
pnpm test:api
```

Tests use the real Better Auth handlers, password hashing, and database-backed
sessions in temporary in-memory SQLite databases. Node 22.13+ is required for
these tests; Node 24 on the VPS supports them. They cover authentication,
session persistence across auth instances, logout revocation, migration
idempotence, cookies, CORS/origin checks, and IP spoofing against rate limits.

For the same suite against actual Postgres, set `AUTH_TEST_DATABASE_URL` to a
**test database connection** before running `pnpm test:api`. The suite creates
and drops a uniquely named schema per database test; it does not touch existing
schemas. The test role must be able to create schemas. SQLite checks do not
replace verifying migrations and queries against Postgres.

Game schema checks require actual PostgreSQL. Run `pnpm test:game-db:local` from
the root to use the loopback development database in `apps/api/.env`, or set
`GAME_TEST_DATABASE_URL` explicitly before `pnpm test:api`. These tests also use
isolated temporary schemas. Preview game migrations with `pnpm game:plan:local`
and explicitly apply with `pnpm game:migrate:local` after the auth migration.

## First VPS deployment

Walk through the code before doing these steps. Add the auth variables to
`~/.config/cosmoids/api.env` before restarting the service. From the repo root on
the VPS:

```bash
git pull --ff-only
HUSKY=0 pnpm --filter @cosmoids/api... install --frozen-lockfile
pnpm build:api
NODE_ENV=production node --env-file="$HOME/.config/cosmoids/api.env" apps/api/dist/auth-migrate.js
```

The last command prints the proposed SQL without changing the database. Review
it, then explicitly apply it:

```bash
NODE_ENV=production node --env-file="$HOME/.config/cosmoids/api.env" apps/api/dist/auth-migrate.js --apply
sudo systemctl restart cosmoids-api
sudo systemctl status cosmoids-api --no-pager
curl https://api.cosmoids-td.com/health/db
curl -i https://api.cosmoids-td.com/api/me
```

The database check should return `{"ok":true}`. `/api/me` should return 401 until
the client signs in. The existing systemd `EnvironmentFile` supplies the new
variables automatically after restart. If migration or build fails, resolve the
failure before restarting. No automatic git push or live deployment is part of
the local code change.

Reference: [Better Auth Fastify integration](https://better-auth.com/docs/integrations/fastify),
[database migrations](https://better-auth.com/docs/concepts/database), and
[email/password authentication](https://better-auth.com/docs/authentication/email-password).
