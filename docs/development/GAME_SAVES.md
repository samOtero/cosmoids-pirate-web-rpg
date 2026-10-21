# Account save database

The database and authenticated profile API are implemented. The game UI and
account-specific local storage are not connected yet. Existing local profiles
are not uploaded automatically. Trade-box transfers and their UI are the next
API stage. The existing account/session tables remain owned by Better Auth.

## Storage

The authored initial schema is
`apps/api/src/migrations/001-game-saves.ts`. Later changes must be new, ordered
migrations; never edit or rename a migration that has already been applied.
`node-pg-migrate` discovers ordered migration files and records their names and
application times. It checks migration ordering, but does not validate checksums;
applied migrations must remain unchanged in source control.

| Table                    | Responsibility                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `game_profiles`          | Stable UUID, account and slot, profile format version, save revision, progress JSON, creation/save timestamps |
| `player_creatures`       | One row per instance, account/original ownership, optional profile, location/order, saved creature attributes |
| `account_trade_boxes`    | One metadata/revision row per account, created on first use                                                   |
| `game_schema_migrations` | Library-managed migration IDs, names, and application timestamps                                              |

An account has at most three profiles, using slots 0 through 2. The UUID identifies
the save independently of its slot. Recreating a deleted slot generates a new
UUID even if the new revision starts at 1.

`profile_data` contains the profile name, last-played value, inventory, progression,
game flags, captured-species history, and journal acknowledgements. It must be a
JSON object. The database rejects duplicate `id`, `ownerId`, `version`, `creatures`,
and `storageCreatures` properties: metadata comes from the profile row, and
creatures come from their own rows. The API will validate the remaining JSON
shape. `profile_version` has no database default; the API must explicitly supply
the supported game profile version.

Creature instance IDs remain text, preserving existing IDs, with UUID text as the
default for new rows. Species and attack IDs remain permanent numeric references
to the authored registries; those registries are not duplicated in database tables.
Base stats, artwork, runtime HP, and unfinished battle state are not saved here.

## Numeric values and placement

Named application constants are in `apps/api/src/game-save-values.ts`.
These assignments are permanent and must not be renumbered or reused.

| Gender (`SMALLINT`) | Value |
| ------------------- | ----- |
| Genderless          | 0     |
| Male                | 1     |
| Female              | 2     |

| Location (`SMALLINT`) | Value | Profile assignment |
| --------------------- | ----- | ------------------ |
| Party                 | 0     | Required           |
| Storage               | 1     | Required           |
| Account trade box     | 2     | Must be null       |

`owner_account_id` always identifies the current account owner. A composite foreign
key ensures that an assigned profile belongs to that same account. A trade-box
creature has no profile and survives deletion of any profile.

Positions are zero-based, nonnegative, and exclusive within each collection.
Party positions are restricted to 0 through 5. Storage and trade box capacity are
not capped by this schema. `UNIQUE NULLS NOT DISTINCT` makes trade-box positions
exclusive despite null profile IDs. The position constraint is deferrable so a
transaction can use `SET CONSTRAINTS player_creatures_position_unique DEFERRED`
to swap positions; duplicates must still be resolved before commit.

Attack IDs must be a one-dimensional, one-based PostgreSQL integer array with one
to four positive, non-null entries. The active move index is zero-based and must
refer to an entry. Species-specific gender, valid/unique/equippable moves, level
limits, and earned progression are API validation responsibilities.

`original_owner_id` records historical account identity. Cloud rows cannot have a
blank or `guest` origin: claiming a guest save must assign those origins before
insertion. The API will protect established original ownership from updates.
This column intentionally has no account foreign key so deleting the original
owner's account does not erase the provenance of a creature owned by someone else.

Deleting a profile cascades to its party/storage creatures. Deleting an account
cascades to its profiles, current creatures, and trade-box metadata. A traded
creature currently owned by another account is retained.

## Profile API

Every profile endpoint uses the real Better Auth session with cookie caching
disabled for the check. The account identity always comes from the session, and
queries are scoped to it. Missing, expired, forged, or revoked sessions return 401. Session renewal cookies are forwarded to the browser. Responses use
`Cache-Control: no-store`.

Writes require an `Origin` exactly matching a configured trusted website; missing,
opaque (`null`), and untrusted origins return 403. CORS explicitly supports GET,
POST, PUT, DELETE, credentialed requests, and JSON content types. Clients send
`credentials: 'include'`; passwords and account IDs are not save parameters.

| Method/path                | Request                                 | Response                                                       |
| -------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `GET /api/profiles`        | None                                    | `{ slots: [summary-or-null, ...] }` with exactly three entries |
| `GET /api/profiles/:id`    | Stable profile UUID                     | Complete saved snapshot                                        |
| `POST /api/profiles`       | `slot` plus snapshot fields             | 201, complete created snapshot                                 |
| `PUT /api/profiles/:id`    | `expectedRevision` plus snapshot fields | Complete saved snapshot with incremented revision              |
| `DELETE /api/profiles/:id` | `{ expectedRevision }`                  | 204 after revision-checked deletion                            |

Snapshot input fields are `profileVersion`, `profileData`, `creatures` (party), and
`storageCreatures`. `profileData` has the remaining fields of the game's `Profile`
type after omitting `id`, `ownerId`, `version`, and both creature collections.
All collection arrays are required. Unknown fields, unsupported versions,
malformed inventory/progression, duplicate creature IDs, and invalid creature
attributes are rejected with 400. Writes are limited to 1 MiB. Storage accepts up
to 10,000 entries subject to that request-size limit.

The returned snapshot includes `id`, `slot`, `profileVersion`, `revision`,
`createdAt`, `savedAt`, `profileData`, `creatures`, and `storageCreatures`. Dates in
the envelope are server ISO timestamps. Creature wire data uses the existing
`PlayerCreature` field names and readable gender/targeting values; numeric
gender/location conversion happens at the database boundary. Missing active move
and targeting values default to index 0 and `first`.

New creature IDs may be included in an explicit create/save request. The server
assigns the authenticated account as their original owner and accepts only absent,
`guest`, or matching-account original-owner input for a new row. Existing rows keep
their original owner, gender, and shiny status. Species changes must follow an
eligible evolution path. Moves must be registered and naturally available at the
creature's level, including inherited moves from earlier evolution stages. TM
teaching will need an explicit extension to that access rule when implemented.

Every existing creature assigned to the profile must be present in the submitted
snapshot; omission returns 409 rather than implicitly releasing a creature.
Reordering party/storage is supported. A save cannot attach a creature from a
different profile/account or from the trade box. The API does not use ownership
upserts: a racing insert of an already-used ID rejects and rolls back the request.
The current validation checks content and ownership, not proof of earned battle
rewards; server-verified captures/XP and trading remain separate work.

Successful saves update the progress row and all assigned creatures atomically.
The profile row is locked before checking the revision. A competing save or
delete with an old revision returns
`{ code: 'STALE_PROFILE', error: '...', latest: <complete snapshot> }` with status
409 and no writes. The game should notify the player and reload that snapshot,
discarding unsaved changes as agreed. Slot conflicts use `SLOT_OCCUPIED` (409).
Creature membership conflicts use `CREATURE_CONFLICT` (409). Missing/deleted or
other-account profile IDs return the same `PROFILE_NOT_FOUND` (404), without
exposing another player's data. Deleted saves are never recreated by PUT.

Unexpected database failures return `SAVE_UNAVAILABLE` (503), roll back the whole
transaction, and allow the game to retain its working copy for retry. A 401 also
retains the working copy while the player logs in. The API does not return raw
database errors or submitted save data in error messages.

## Revisions and box transfers

The database supplies positive revision defaults and server timestamp defaults.
It does not automatically increment revisions or update timestamps on arbitrary
SQL writes. The API must do so explicitly inside the same transaction as the
associated changes. Profile saves implement this; box transactions are planned:

- A manual save checks the authenticated account, profile UUID, and expected
  revision, then writes progress and assigned creatures and increments the
  profile revision. An outdated client receives the latest save and discards its
  unsaved work after the player is notified.
- Depositing or withdrawing is an immediate Save & Move transaction. Check both
  the profile and trade-box revisions, save the profile, move the existing
  creature row, and increment both revisions. Any failure rolls back everything.
- Moving a creature does not create a new instance or change its original owner.
  The API must not let a stale snapshot recreate or reclaim a transferred row.
- Temporary network errors retain the local working copy for a retry. Account
  saves do not resume an unfinished battle.

## Compiling authored validation data

`apps/api/scripts/build-game-content.mjs` compiles the canonical web registries
into the ignored `apps/api/dist/authored-game-content.js` server module. It reads
the actual creature/attack registries, profile/level limits, story milestones,
and flags. There is no second authored gameplay inventory or JSON manifest.
API build, development startup, and tests compile this module. Restart the API
after editing authored game content during development. Production runs the
compiled module and does not read web sources or artwork at runtime.

Tests compile the repository's typed profile/creature builders into an ignored
test-only module, rather than duplicating their defaults or relying on browser
path aliases in Node. Those helpers are not part of the production API build.

## Migration commands

PostgreSQL 15 or newer is required for `UNIQUE NULLS NOT DISTINCT`; local Docker
uses PostgreSQL 17. Apply the existing auth migration first. From the repository
root, preview and explicitly apply against the development settings in the ignored
`apps/api/.env`:

```sh
pnpm game:plan:local
pnpm game:migrate:local
```

Both commands use `node-pg-migrate` 9. The preview runs its dry-run mode inside a
transaction that is always rolled back, so even a fresh database has no persistent
history table or schema changes afterward. Keep migrations declarative: queue SQL
with `pgm.sql` rather than executing queries directly or performing external work.

Apply uses the library's advisory lock, ordering checks, and one transaction for
all pending migrations and their history entries. Repeated applies are safe.
Failure, including missing auth tables, rolls back the attempted schema changes
and history entries; the library may leave an empty history table on a fresh
database. Server startup never runs game migrations.

Add the next numbered TypeScript file under `apps/api/src/migrations`, exporting
an `up(pgm)` function. The API build compiles it into `dist/migrations` for the VPS;
the runner resolves that directory relative to itself, independently of the shell
working directory. Never import current game definitions into a historical
migration. Keep its SQL self-contained so replaying history remains repeatable.
The initial migration disables `down` because undoing it would delete saves;
schema fixes should be new forward migrations. Better Auth migrations stay separate.

For a built deployment, explicitly supply its environment file:

```sh
pnpm build:api
node --env-file=/path/to/api.env apps/api/dist/game-migrate.js
node --env-file=/path/to/api.env apps/api/dist/game-migrate.js --apply
```

## Verification

```sh
pnpm typecheck:api
pnpm build:api
pnpm test:api
pnpm test:game-db:local
```

The default API suite runs database-independent tests and skips the game schema
tests unless `GAME_TEST_DATABASE_URL` explicitly names a test database. The local
command loads `apps/api/.env` and requires a loopback, non-production database.
Tests apply the real Better Auth and game migrations inside uniquely named
`game_test_*` schemas, then remove only those schemas. They do not change the
application's normal tables. The test role needs permission to create schemas.
Test files run sequentially because Better Auth introspects all accessible schemas;
one file must not remove a schema while another is inspecting it. Concurrency
behavior is still exercised explicitly inside the migration and save tests.

Coverage includes real HTTP/Better Auth sessions and PostgreSQL save requests,
authentication/origin/ownership failures, concurrent save revisions, cookie
renewal, slot reuse, cross-profile/box isolation, malformed/oversized requests,
and transaction rollback/retry. It also includes preview without persistent changes,
repeat and concurrent migration application, transaction rollback, migration-order
checks, slot limits, cross-account
relationships, numeric values, collection ordering, attack array boundaries,
deletion behavior, and reused-slot identity.
