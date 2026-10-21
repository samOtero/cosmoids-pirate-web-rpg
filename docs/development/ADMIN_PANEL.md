# Player record administration

The view-only panel is exported at `/admin` with the game. It uses the existing
Cosmoids login and calls the Fastify API on the VPS. The exported page contains
no player records, account allowlist, or database credentials. It supports desktop
and portrait mobile screens and does not display the game's rotation overlay.

## Access

Admin access is disabled by default. Create a normal game account, then obtain its
exact `user.id` from the authenticated `/api/me` response or from PostgreSQL on the
VPS. As the database administrator, use a parameterized email lookup of
`SELECT id FROM "user" WHERE email = $1`; do not select password or session fields.

Add that ID to the private API environment file on the VPS,
`/home/deploy/.config/cosmoids/api.env`:

```dotenv
ADMIN_ACCOUNT_IDS=the-exact-account-id
```

Multiple IDs can be comma-separated. IDs are exact matches; names, emails and
wildcards do not grant access. Never put this setting in a `NEXT_PUBLIC_` variable
or a tracked environment file. For local development, use the ignored
`apps/api/.env`. Restart the API after adding or removing an ID. No schema migration
is required for the allowlist. Signup cannot assign admin access.

The frontend also needs its existing `NEXT_PUBLIC_API_URL` build setting. The game
origin must already be in the API's `AUTH_TRUSTED_ORIGINS`. No additional hostname
or hosting service is required: visit `https://<game-host>/admin` after deployment.

Every admin request checks the real Better Auth session with cookie caching
disabled, then checks the private allowlist. Missing/expired/revoked sessions get
401; regular accounts get 403. Renewal cookies are forwarded. Admin responses use
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. Client data stays
in component memory and is removed when access is denied or the session changes.

## Inspection

- Search accounts by email, display name, or exact account ID; results are paginated.
- Inspect the three profile slots and shared account trade-box summary.
- Open profiles to view revision, format, timestamps, progress, inventory, flags,
  and the complete saved profile JSON.
- Browse party, storage, or boxed creatures in pages; inspect species, level, XP,
  gender, shiny status, moves, targeting, current owner, original owner, and placement.

Names and icons come from the canonical game registries. Unknown definition IDs
still display their numeric identity so older or inconsistent saves can be inspected.
Only cloud records are visible; device-only guest saves are not uploaded by the panel.
Trade-box inspection is supported even though transfer endpoints are not built yet.

All inspection queries run in read-only, repeatable-read database transactions.
Account queries select an explicit list of public account fields and never include
password hashes, session tokens or login-provider credentials. Admin routes do not
add write operations or expand the ownership permissions of ordinary player routes.

| GET endpoint                                                     | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `/api/admin/session`                                             | Verify admin access                                |
| `/api/admin/accounts?q=&limit=25&offset=0`                       | Search accounts                                    |
| `/api/admin/accounts/:id`                                        | Account, profile slots and trade-box summary       |
| `/api/admin/profiles/:id`                                        | Saved profile metadata and progress                |
| `/api/admin/accounts/:id/creatures?location=party&profileId=...` | Paginated profile party; use `storage` for storage |
| `/api/admin/accounts/:id/creatures?location=tradeBox`            | Paginated shared-box creatures; no profile ID      |
| `/api/admin/creatures/:id`                                       | Creature details and ownership                     |

Collection responses are `{ items, total, limit, offset }`. Limits are 1–50;
offsets are nonnegative. The game and API deployments should use matching game
definitions. Reload the panel for fresh records after inspecting another player's
ongoing saves.

## Verification

Run `pnpm test:game-db:local` for real PostgreSQL/session authorization and
inspection tests. `pnpm test:api` includes the access-configuration test and runs
the database tests when explicitly configured with `GAME_TEST_DATABASE_URL`.
Frontend interaction coverage is in
`apps/web/src/__tests__/integration/adminPanel.test.tsx`; run `pnpm verify:quick`
and `pnpm build` for the web checks and exported `/admin` page.
