# Game accounts

The game uses Better Auth's React client to connect to the existing Fastify API.
The client and API both use Better Auth 1.7.7. Account authentication is separate
from game saves: this first version does not upload, migrate, or synchronize saves.

## Where the code lives

| File                                                   | Purpose                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `apps/web/src/lib/auth-client.ts`                      | Client URL, cookie requests, session refresh options, public error messages     |
| `apps/web/vercel.json`                                 | Redirects the original staging host to its custom domain                        |
| `apps/web/src/lib/legacy-game-redirect.ts`             | Builds an early HTML redirect fallback from the same Vercel rules               |
| `apps/web/src/app/components/auth/AuthProvider.tsx`    | Mounts one session hook for the game and shares its state through React context |
| `apps/web/src/app/components/auth/AccountLauncher.tsx` | Login/signup actions, automatic profile navigation, and guest play              |
| `apps/web/src/app/components/auth/AccountIdentity.tsx` | Display name, logout, and session retry on the profile selection screen         |
| `apps/web/src/app/components/auth/AccountDialog.tsx`   | Accessible native dialog, forms, submissions, and session confirmation          |
| `apps/web/src/app/components/auth/account.module.css`  | Account UI and responsive dialog styles                                         |
| `apps/web/src/__tests__/integration/accounts.test.tsx` | Uses the real client against controlled HTTP responses                          |
| `apps/api/src/auth.ts`                                 | Server password rules, cookie security, rate limits, and database configuration |
| `apps/api/src/auth-routes.ts`                          | Fastify adapter, cookie forwarding, CORS, session and identity endpoints        |

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
browser-exposed environment variables. If the API URL is absent, the game renders its
guest launcher without mounting the session hook or calling the account API.

The client calls the configured API directly. The custom staging domain and API
share the site `cosmoids-td.com`, allowing our existing session cookies to work.
The custom game origin must remain in the API's `AUTH_TRUSTED_ORIGINS`.

### Old URL redirects and local saves

`apps/web/vercel.json` redirects only the original experimental hostname:

`https://cosmoids-pirate-web-rpg-git-experimental-sams-projects-022093db.vercel.app`

It sends visitors to `https://staging.cosmoids-td.com`, preserving the path and
query string. It uses a temporary 307 redirect while the game is in development,
so a browser does not permanently remember this transition. The rule runs on
Vercel before loading the game. It does not match the custom domains, localhost,
the production URL, or other preview deployment URLs.

The exported HTML also includes an inline redirect in its head, generated from
the same rules. This is a fallback for the observed deployment behavior where
the old hostname returned game HTML with status 200 instead of redirecting.
It runs before the game hydrates and preserves the path, query and fragment.
It requires no game JavaScript bundle to load. The browser uses
`location.replace`, avoiding an extra old-game entry in its history. It runs
only after Vercel permits access to the HTML; preview authentication still applies.

The development-stage decision is to start fresh on the custom domain without a
save migration. LocalStorage belongs to each origin, so players coming from the
old URL see the custom domain's own save profiles. Existing saves on the custom
domain stay available; the redirect does not clear them. Old-origin saves are
not imported or deleted. Account records in Postgres are unaffected.

There is no auth proxy or additional proxy secret to configure. If the earlier
proxy setting `AUTH_PROXY_SECRET` was already added to Vercel or the VPS env
file, it can be removed; keep `BETTER_AUTH_SECRET` unchanged. See
[the redirect rollout steps](../../apps/api/OPERATIONS.md#game-url-redirect-rollout).

Production is prepared in that reference, with a rule mapping
`cosmoids-pirate-web-rpg.vercel.app` to `https://cosmoids-td.com`. That rule is
not active yet: first connect and verify the production custom domain, then add
the documented rule and deploy it to production.

## Account flow

- Guests can open their local save profiles even while account checking is slow
  or unavailable.
- Signup sends display name, email, and password. The API requires passwords of
  12–128 characters. Login sends email and password.
- After successful signup or login, the UI checks `/api/auth/get-session` before
  closing the form. A successful POST alone does not prove the browser retained
  its session cookie. Failed confirmation leaves the form open with guidance.
- Confirmed login or signup opens cloud profile selection immediately.
  An existing session restored on the start screen offers Start to open those
  profiles. Offline play opens device-local profiles.
- The profile selection screen shows the account display name and Log out.
  Logout returns to the start screen; guests retain their Back button.
- Login and logout do not claim or relabel existing profiles. Local saves remain
  specific to each origin under `cosmoids-game-state`.

The browser manages the Secure/HttpOnly production cookie. The client sends
`credentials: 'include'`; session tokens and passwords are not persisted in the
game's localStorage or logged by the account UI.

## Save and creature ownership

New profiles record `ownerId` using the signed-in account's stable user ID, or
`"guest"` for guest play. All three slots created for the same account share that
identity; slot numbers and display names do not establish ownership. Profile
creation waits while the initial account lookup is pending.

Every saved `PlayerCreature` records `originalOwnerId`. New starters, captures,
story grants, and development roster replacements receive the destination
profile's owner ID when their origin is absent or `"guest"`. An established
account origin is preserved. Party/storage moves, attack updates, evolution,
battle writeback, and save reload retain the original owner. Captures receive
the profile owner inside the battle engine as well as in the saved collection.
Species definitions and unowned wild creatures do not carry player ownership.

Profile version 11 introduces this required metadata. Older profiles reset
through the existing version checks on selection and hydration; no save
migration is performed.

Offline ownership remains local metadata. Cloud access is enforced by the API,
which derives the account from its session and assigns/preserves original
ownership. Login neither claims nor uploads existing local profiles. Explicit
guest claiming and trade-box
integration remain separate stages. Account local drafts are deferred.

The database has explicit game migrations for profiles, individual creatures,
and account trade boxes. Authenticated profile endpoints now support listing,
loading, creation, revision-checked saving, and deletion. The game UI now loads
cloud slots and selected profiles into memory and supports creating and deleting
cloud profiles. New profiles are written immediately before their introduction;
deletion requires a named confirmation and the expected server revision. A manual
Save bar now writes profile/creature changes from menus outside battles. Box
transfers remain a separate stage. See
[account save storage and API](GAME_SAVES.md) for the schema, permanent numeric
gender/location values, request contract, and local verification.

The frontend transport (`apps/web/src/lib/profile-client.ts`) now wraps those
profile endpoints and prepares separate cloud UUID/revision metadata alongside a
game profile and an in-memory comparison baseline. Manual updates send only
added/changed creature records; original/current owners are controlled by the
backend. Account profiles now load into the game store with separate cloud
metadata, box layout and baseline. The existing local-storage key persists only
local profiles. Refreshing drops unsaved account progress and loads from the
database again. Explicit logout/offline play restores local profiles. Switching
accounts clears prior working copies and aborts/ignores old requests; an expired
session retains copies while the player logs back in. Loading errors show Retry
instead of substituting local profiles or empty cloud slots.

Creation/deletion errors keep existing data visible. A conflicting or unconfirmed
write requires Refresh saves before another attempt; deletion then requires a
fresh confirmation. Switching accounts or logging out prevents late responses
from changing the next account. Account writes never change the guest bank or
store cloud data in local storage.

The selected cloud profile's menus display unsaved changes and its confirmed save
time. Saving sends changed fields/creatures with the last revision. Successful
requests advance the baseline without overwriting edits made during the request.
Stale revisions show a notice before loading the latest saved progress and
discarding this tab's unsaved work. Network/timeout outcomes require Check cloud
save before another write; known failures preserve the draft for explicit retry.
Expired saves offer login without clearing the working copy. Unsaved account
tabs warn before closing/reloading. Unfinished battles remain excluded from saves.

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

After deploying the redirect, open the original staging URL and verify it lands
on the custom staging domain with no redirect loop. Test a URL with a path and
query string as well. On the custom domain, check login, refresh and logout on
the phone that previously failed. Vercel preview protection may require an
authorized Vercel login before the game or redirect can be reached. Local
`pnpm dev` does not apply Vercel's edge routing. The HTML fallback reads the same
rules and is inactive on localhost. Verify the destination address in the live
browser; an old-document 200 followed by navigation can be the fallback working.

The fallback was checked in WebKit and Chromium using the production HTML with
all game JavaScript/CSS requests blocked. It still navigated to the custom
staging URL and preserved paths, queries and fragments. Custom domains,
localhost, unrelated previews and the production URL stayed in place.

Before inviting players publicly, configure email verification and password
recovery, test database backups/restores, and decide how staging will be isolated
from production accounts. Email/password accounts are currently unverified and
there is no password recovery UI. Cloud saves, save imports, server-validated
creature ownership, shiny validation, and trading remain separate future work.

References: [Better Auth client](https://better-auth.com/docs/concepts/client),
[email/password](https://better-auth.com/docs/authentication/email-password),
[session management](https://better-auth.com/docs/concepts/session-management),
and the [API operations reference](../../apps/api/OPERATIONS.md).

Creature and attack references now use permanent numeric definition IDs. Profile version 12 resets older string-ID saves without migration. Account owner IDs and individual creature IDs remain strings. See [definition ID conventions](DEFINITION_IDS.md).
