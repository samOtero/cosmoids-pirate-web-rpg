# Game accounts

The game uses Better Auth's React client to connect to the existing Fastify API.
The client and API both use Better Auth 1.7.7. Account authentication is separate
from game saves: this first version does not upload, migrate, or synchronize saves.

## Where the code lives

| File | Purpose |
| --- | --- |
| `apps/web/src/lib/auth-client.ts` | Client URL, cookie requests, session refresh options, public error messages |
| `apps/web/src/app/components/auth/AuthProvider.tsx` | Mounts one session hook for the game and shares its state through React context |
| `apps/web/src/app/components/auth/AccountLauncher.tsx` | Login/signup actions, signed-in identity, Continue, logout, and guest play |
| `apps/web/src/app/components/auth/AccountDialog.tsx` | Accessible native dialog, forms, submissions, and session confirmation |
| `apps/web/src/app/components/auth/account.module.css` | Account UI and responsive dialog styles |
| `apps/web/src/__tests__/integration/accounts.test.tsx` | Uses the real client against controlled HTTP responses |
| `apps/api/src/auth.ts` | Server password rules, cookie security, rate limits, and database configuration |
| `apps/api/src/auth-routes.ts` | Fastify adapter, cookie forwarding, CORS, session and identity endpoints |

## Configuration

### Local Docker setup

`compose.local.yaml` runs a separate Postgres 17 database named `cosmoids_dev`.
It publishes port **5433 on 127.0.0.1** and stores data in Docker's
`cosmoids-local_postgres-data` volume. Using host port 5433 avoids conflicts with
other local databases. The database's internal container port remains 5432.

Keep the database credentials and auth secret in ignored `apps/api/.env`:

```dotenv
NODE_ENV=development
PGHOST=127.0.0.1
PGPORT=5433
PGDATABASE=cosmoids_dev
PGUSER=cosmoids_dev
PGPASSWORD=YOUR_LOCAL_DATABASE_PASSWORD
BETTER_AUTH_SECRET=YOUR_RANDOM_LOCAL_AUTH_SECRET
BETTER_AUTH_URL=http://localhost:3001
AUTH_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:3002
```

The initial setup generated random secrets in this private file without printing
them. These values are independent of the VPS. For a fresh setup on another
computer, generate new values and replace the placeholders. The auth secret must
be at least 32 characters long.

From the repository root, start the database and apply the auth tables once:

```sh
pnpm db:up
pnpm auth:migrate:local
```

Then run the API and game in separate terminals:

```sh
pnpm dev:api
```

```sh
pnpm dev
```

The API development script loads `apps/api/.env` and watches source changes.
Open `http://localhost:3001/health/db` to check the database, and
`http://localhost:3000` to play. If using port 3002 for the game, run
`pnpm --filter @cosmoids/web dev --port 3002` and open that exact origin.
Use `localhost` consistently in browser URLs.

`pnpm db:stop` stops the local database while preserving its data; `pnpm db:up`
starts it again. Initial Docker database variables only initialize an empty data
volume. Editing `PGPASSWORD` afterward does not change the existing database
password; keep the file and database credentials synchronized.

### Web API URL

For local development, put the following public setting in
`apps/web/.env.local` and run the local API separately:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For the experimental Vercel deployment, use its existing Preview setting:

```dotenv
NEXT_PUBLIC_API_URL=https://api.cosmoids-td.com
```

Next.js embeds this public URL at build time; restart development or redeploy
after changing it. Never add database credentials or `BETTER_AUTH_SECRET` to
frontend environment variables. If the API URL is absent, the game renders its
guest launcher without mounting the session hook or calling the account API.

Use `https://staging.cosmoids-td.com` for the first real browser login test.
Its origin must be in the API's `AUTH_TRUSTED_ORIGINS`. The original Vercel
addresses remain usable for local guest saves, but reliable login there still
requires the same-origin proxy described in `apps/api/OPERATIONS.md`. This change
does not implement that proxy or redirect players away from their old saves.

## Account flow

- Guests can open their local save profiles even while account checking is slow
  or unavailable.
- Signup sends display name, email, and password. The API requires passwords of
  12–128 characters. Login sends email and password.
- After successful signup or login, the UI checks `/api/auth/get-session` before
  closing the form. A successful POST alone does not prove the browser retained
  its session cookie. Failed confirmation leaves the form open with guidance.
- Signed-in players see their name, Continue, and Log out on the start screen.
  Continue opens the same device-local profile selection as guest play.
- Login and logout do not modify `cosmoids-game-state`. Profiles are not yet
  associated with account ownership; local saves remain specific to each origin.

The browser manages the Secure/HttpOnly production cookie. The client sends
`credentials: 'include'`; session tokens and passwords are not persisted in the
game's localStorage or logged by the account UI.

## Refresh and failures

The provider stays mounted while the player changes game screens. The client
checks on startup, when the tab becomes visible, and when connectivity returns.
Fixed-interval polling is disabled (`refetchInterval: 0`), and offline refetches
are disabled. Requests have a 15-second timeout. Network failures display a
retry option and do not delete local saves or force the game back to its title.
The client retains a previously known session during temporary network failures;
protected server actions must still verify their session on every request.

Better Auth's default server lifetime is seven days, with renewal eligible after
one day. Refresh uses `/api/auth/get-session`, whose adapter forwards renewed
cookies. The custom `/api/me` route currently returns identity without forwarding
renewal cookies, so it is not used as the browser's renewal endpoint.

## Validation and rollout

Run the focused account test and type checking from the repository root:

```sh
pnpm --filter @cosmoids/web exec vitest run --project=unit src/__tests__/integration/accounts.test.tsx --maxWorkers=2
pnpm typecheck
```

Before deploying, verify the web build and then test the real staging domain:
create a test account, log out, log in, refresh the page, return after switching
tabs, and confirm existing local profiles remain available. Controlled HTTP tests
do not replace checking real browser cookies, Nginx, CORS, and Postgres together.

Before inviting players publicly, configure email verification and password
recovery, test database backups/restores, and decide how staging will be isolated
from production accounts. Email/password accounts are currently unverified and
there is no password recovery UI. Cloud saves, save imports, creature ownership,
shiny validation, and trading remain separate future work.

References: [Better Auth client](https://better-auth.com/docs/concepts/client),
[email/password](https://better-auth.com/docs/authentication/email-password),
[session management](https://better-auth.com/docs/concepts/session-management),
and the [API operations reference](../../apps/api/OPERATIONS.md).
