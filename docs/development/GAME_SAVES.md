# Account save database

The database, authenticated profile API and frontend transport are implemented.
The game client loads account slots and selected cloud profiles into memory.
Cloud creation/deletion controls and manual saving are not connected yet. Existing
local profiles are not uploaded automatically. Trade-box transfers and their UI are the next
API stage. The existing account/session tables remain owned by Better Auth.

The frontend profile API client is implemented as the first game-integration stage.
Account profiles will initially live only in memory between explicit cloud saves;
account local drafts are deferred. Guest saves retain their existing local storage.

## Storage

The initial schema is `apps/api/src/migrations/001-game-saves.ts`.
`002-profile-storage-boxes.ts` adds per-profile storage boxes and moves profile
collection ordering off creature rows. Later changes must be new, ordered
migrations; never edit or rename a migration that has already been applied.
`node-pg-migrate` discovers ordered migration files and records their names and
application times. It checks migration ordering, but does not validate checksums;
applied migrations must remain unchanged in source control.

| Table                    | Responsibility                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `game_profiles`          | Stable UUID, account and slot, profile format version, save revision, progress JSON, creation/save timestamps |
| `profile_storage_boxes`  | Stable UUID, profile, name, box-menu position and ordered creature IDs                                        |
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

Party order is a `TEXT[]` on `game_profiles.party_order`. Each profile storage box
has a UUID, name, box-menu position and `creature_order TEXT[]`. Creature rows keep
`profile_id`, numeric `location` and `storage_box_id`; they have no party/storage
position. A composite foreign key ensures the assigned box belongs to the same
profile. Storage requires a box; party and account trade-box creatures cannot
reference a profile storage box. Populated boxes cannot be deleted directly.

The existing nullable creature `position` column now applies only to the account
trade box, where positions remain unique per account until that API is built.
Profile collection arrays are one-dimensional, contain no null IDs, and party
size is at most six. API transactions validate exact membership and uniqueness
across all lists. Rearranging creatures changes only the relevant order list,
not their rows. A genuine box/party move updates the creature assignment plus both
source/destination lists. Box-menu positions are zero-based and unique per profile;
their constraint is deferrable for a swap.

Migration 002 backfills a default 'Box 1' for every existing profile, copies the
old party/storage sequence in position order, assigns stored creatures to that
box and clears their former positions. Account trade-box positions, creature IDs,
ownership, profile revisions and gameplay data are retained. New profile creation
also starts with one default box. This migration is not applied automatically by
server startup; apply it before running the updated API.

Attack IDs must be a one-dimensional, one-based PostgreSQL integer array with one
to four positive, non-null entries. The active move index is zero-based and must
refer to an entry. Species-specific gender, valid/unique/equippable moves, level
limits, and earned progression are API validation responsibilities.

`original_owner_id` records historical account identity. Cloud rows cannot have a
blank or `guest` origin: claiming a guest save must assign those origins on
insertion. The API preserves established original ownership on updates.
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

| Method/path                | Request                                                                         | Response                                                       |
| -------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GET /api/profiles`        | None                                                                            | `{ slots: [summary-or-null, ...] }` with exactly three entries |
| `GET /api/profiles/:id`    | Stable profile UUID                                                             | Complete saved snapshot                                        |
| `POST /api/profiles`       | `slot` plus initial snapshot fields                                             | 201, complete created snapshot                                 |
| `PUT /api/profiles/:id`    | `expectedRevision`, `profileVersion`, optional `profileData`, `creatureChanges` | Compact profile metadata with incremented revision             |
| `DELETE /api/profiles/:id` | `{ expectedRevision }`                                                          | 204 after revision-checked deletion                            |

Creation sends `profileVersion`, `profileData`, `creatures` (party) and
`storageCreatures`, with both collection arrays required. Subsequent saves send
only changed creature records:

```ts
{
  expectedRevision: 7,
  profileVersion: CURRENT_PROFILE_VERSION,
  profileData: { /* complete profile data, only when changed */ },
  creatureChanges: {
    added: [ /* complete new creature records */ ],
    updated: [ /* complete changed existing creature records */ ],
    order: {
      party: [ /* complete party IDs, only if changed */ ],
      storage: [
        { id: boxUuid, name: 'Training', position: 1, creatureIds: [ /* complete IDs in this changed box */ ] }
      ]
    }
  }
}
```

`added` and `updated` are required arrays, including when empty. `order` is
optional; its `party` and `storage` fields are individually optional. `party`
replaces the complete party list. `storage` contains only changed boxes, with
complete `{ id, name, position, creatureIds }` records. A new box UUID creates a
box; an ID belonging to another profile is rejected. Box UUIDs remain stable
when renaming/reordering. Omitting a box leaves it untouched; implicit box removal
is not supported. The API permits at most 1,000 boxes and 10,000 stored creatures
per profile as request/resource bounds, not a designed per-box gameplay capacity.

Every addition must appear in a submitted order list. The backend merges changed
lists with untouched lists, validates that each assigned/new creature appears
exactly once, and updates assignments for genuine moves. Moving between boxes
requires both changed boxes; party/storage transfers require the changed party
list and box. Duplicate membership, omissions and foreign IDs are rejected and
roll back the complete transaction. Rearranging a box does not update creature
rows. Releases and account trade-box transfers require separate explicit
operations. An empty change set still confirms a manual save and increments the
profile revision.

`profileData`, when present, replaces the complete small profile-data object; its
fields are the game's `Profile` fields except `id`, `ownerId`, `version` and the
creature collections. If omitted, existing profile data is preserved. Unknown
fields, unsupported versions, malformed progression/inventory, duplicate IDs
across additions/updates or order lists, and invalid attributes return 400.
Writes remain limited to 1 MiB; party size is bounded by the game limit and storage
by 10,000 entries.

Creature input contains instance/species IDs, gender, level, XP, shiny status,
equipped attack IDs, active move index and targeting mode. Current/original owner
fields are not accepted in create or update input. The server assigns both owners
from the authenticated account for new rows; existing rows preserve their original
owner. Client-created player creatures use `crypto.randomUUID()` at acquisition;
IDs stay stable through saves, evolution and transfers. A globally occupied ID in
`added` is a conflict, never an update; a missing, foreign-profile, other-account
or trade-box ID in `updated` is also a conflict. Racing inserts use the database
primary key as the final collision protection and roll back the entire request.

Existing gender and shiny status are immutable; species changes must follow an
eligible evolution path. Moves must be registered and naturally available at the
creature's level, including inherited moves from earlier family stages. TM teaching
will need an explicit extension. Validation checks content and ownership, not
proof of earned captures/XP; server-verified rewards and trading remain separate.

Load/create responses include `id`, `slot`, `profileVersion`, `revision`,
`createdAt`, `savedAt`, `profileData`, `creatures`, `storageCreatures` and
`storageBoxes`. The flat storage collection is ordered by box-menu position, then
each box's creature list, for the current screen. They
include creature `originalOwnerId` for display. Successful updates return only
`id`, `slot`, `profileVersion`, `revision`, `createdAt` and `savedAt`, avoiding a
full collection download after every save. Envelope dates are server ISO timestamps.
Gender/targeting wire values remain readable; numeric gender/location conversion
happens at the database boundary. Missing active move/targeting values default to
index 0 and `first`.

Saves lock the profile row, check the revision, and apply profile data, changed
creatures, additions and ordering in one transaction. Omitted records are neither
updated nor deleted. When order is absent, only submitted creature IDs are read;
profile-only changes skip creature reads entirely. Stale saves/deletes return
`{ code: 'STALE_PROFILE', error: '...', latest: <complete snapshot> }` with status
409 and no writes. The game should notify the player and load that snapshot,
discarding unsaved changes as agreed. Slot conflicts use `SLOT_OCCUPIED` (409).
Creature conflicts use `CREATURE_CONFLICT` (409). Missing/deleted and other-account
profile IDs both return `PROFILE_NOT_FOUND` (404), without exposing another
player's data. Deleted saves are never recreated by PUT.

This replaces the earlier full-snapshot PUT contract. Deploy the updated API and
frontend client together, applying migration 002 first. Account loading uses this
client contract; cloud writes are not yet connected to the game UI.

Unexpected database failures return `SAVE_UNAVAILABLE` (503), roll back the whole
transaction, and allow the game to retain its working copy for retry. A 401 also
retains the working copy while the player logs in. The API does not return raw
database errors or submitted save data in error messages.

## Frontend save client (stage 1)

`apps/web/src/lib/profile-client.ts` provides `profileClient.list`, `load`, `create`,
`save`, and `delete`. It uses the existing `NEXT_PUBLIC_API_URL`, sends session
cookies with `credentials: 'include'`, and disables response caching. Writes send
JSON; account identity and passwords are never request parameters. Every operation
accepts an optional `{ signal }` for cancellation and has a 15-second timeout.
The client never retries automatically, including writes whose server result may
be unconfirmed after a connection failure or timeout.

`apps/web/src/types/cloudProfile.ts` defines the API payloads and a working-copy
shape containing `{ profile, cloud, storageBoxes, baseline }`. The game retains its numeric slot-based
`Profile.id`; `cloud.id` is the database UUID and `cloud.revision` is the last
confirmed server revision. `createCloudWorkingCopy(saved, accountId)` prepares
that independent in-memory copy using the caller's confirmed session identity.
It preserves creature instance IDs and original ownership and copies mutable
collections rather than sharing them with the response snapshot.

`createCloudSnapshot(profile)` projects only saved fields, stripping profile and
creature ownership metadata and runtime battle fields. It is used for creation
and for an in-memory comparison baseline, not full-snapshot updates.
`createCloudChanges(profile, baseline)` compares against the last confirmed
baseline and emits added/updated creature records, changed profile data, party
order and individual changed boxes only when needed. Ownership/runtime changes do not mark creatures dirty.
Implicit creature/box removals and duplicate current IDs fail locally before any
request.

`profileClient.save(cloud, profile, baseline, options?)` captures the submitted
snapshot before the request, then returns `{ cloud, baseline }` only after a valid
compact confirmation. Callers adopt those values on success. The optional
`options.storageBoxes` provides an edited complete layout for future box controls;
only changed box records are uploaded. Without it, the existing flat screen
preserves each known creature's box, orders creatures within their existing boxes,
and assigns new or party-to-storage creatures to the first box. Changes made while
the request is pending remain different from the returned baseline, so they are
not accidentally marked saved. Failures do not mutate the previous baseline or
revision. Load/create still return full snapshots; `createCloudWorkingCopy` makes
an independent baseline and box draft when preparing the working profile. No baseline is stored
in local storage. Unsupported profile versions are rejected rather than relabeled.

`ProfileApiError` preserves HTTP `status`, server `code` and message. A valid
`STALE_PROFILE` conflict also exposes `latest`; malformed conflict snapshots are
not treated as usable profiles. Successful responses are checked for the expected
transport shape without duplicating authored species/move legality validation.
Local errors use status 0 and codes `NOT_CONFIGURED`, `NETWORK_ERROR`, `TIMEOUT`
or `UNSUPPORTED_PROFILE_VERSION`, `INVALID_PROFILE`, `UNSUPPORTED_CREATURE_REMOVAL`,
`UNSUPPORTED_BOX_REMOVAL`; malformed successful responses use
`INVALID_RESPONSE`. Caller cancellation preserves the original abort reason.

This layer does not modify the game store, write local storage, replace a working
copy on conflict, or add a Save button. Those behaviors belong to later integration
stages. Focused transport and adapter tests are in
`apps/web/src/__tests__/utils/profileClient.test.ts`.

## Account profile loading (stage 2)

`apps/web/src/store/profileSession.ts` owns runtime-only account state.
`useProfileSession` follows the confirmed identity from `AuthProvider`. The profile
screen waits for the initial identity, lists account summaries and loads a selected
UUID before entering the existing game navigation. Empty cloud slots cannot create
local saves. Cloud deletion and local test templates are disabled in account mode
until their dedicated stages. The screen states that progress cannot be saved yet.

Existing game actions continue to operate on `profiles`. Entering account mode
preserves the local bank in `guestProfiles`, clears the selection and loads cloud
working copies into the active bank. Each loaded slot has cloud metadata, editable
boxes and a last-confirmed baseline in `cloudProfiles`. Reopening a loaded slot in
the same session resumes its working copy without another server load. Refreshing
summaries does not replace working copies. Login neither claims nor uploads local
profiles.

Persistence still uses `cosmoids-game-state`, but serializes only the local bank.
No account profile, summary, UUID/revision, box draft or baseline is written to
local storage. Hydration accepts only the persisted `profiles` property and cannot
overwrite an active account bank with disk data. Reopening the browser restores
the session cookie, fetches cloud slots and loads database progress on selection;
unsaved account progress is not restored. Unsupported cloud versions are rejected
without resetting the server save. Local hydration/version behavior is preserved.

Account changes abort requests and clear prior working copies, selection, dialogue,
events and level configuration. Requests also check an in-memory generation and
account identity before adopting responses, covering responses that finish after
cancellation. Explicit logout/offline play restores local profiles. Expired or
temporarily unavailable sessions retain working copies in this tab; the profile
screen requests authentication again. The same login resumes those copies. A
different account clears them. Errors show Retry, with no local-data fallback.

Focused tests are `profileSession.test.ts` (persistence, refresh, races/failures)
and `profileOwnership.test.tsx` (Home/profile-screen flow, identity gating, retries
and Strict Mode). Cloud fixtures use typed builders independent of serialization.

## Revisions and box transfers

The database supplies positive revision defaults and server timestamp defaults.
It does not automatically increment revisions or update timestamps on arbitrary
SQL writes. The API must do so explicitly inside the same transaction as the
associated changes. Profile saves implement this; box transactions are planned:

- A manual save checks the authenticated account, profile UUID, and expected
  revision, then writes changed progress/creatures and ordering and increments the
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
