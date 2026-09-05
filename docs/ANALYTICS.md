# Gameplay analytics

PostHog receives optional, explicitly selected gameplay events. The browser SDK
is loaded only after consent, in production, outside localhost and the experimental
branch. Active test-profile rosters and unknown/editor levels are excluded.
Players can allow or turn off collection using **Privacy & feedback** on menus.
Consent is separate from save profiles and shared by this browser's profiles.
Existing Vercel website analytics is independent of this gameplay integration.

## Deployment

Set these build-time environment variables on the hosting project before rebuilding:

```text
NEXT_PUBLIC_POSTHOG_KEY=<project ingestion token>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

The supplied values are saved in the ignored `.env.local` for local builds.
They are not automatically uploaded to the hosting provider. This token is the
public ingestion token, never a personal/admin API key. Next.js embeds public
environment variables during the static export; changing them requires a rebuild.
The integration uses direct ingestion and adds no backend/proxy hosting cost.

## Events

| Event                | Meaning / properties                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_started`       | Player activates the start button with consent already granted                                                                                                          |
| `level_started`      | Simulation first starts; level ID, story/challenge mode, random attempt ID, team entries as species:level                                                               |
| `level_finished`     | Win, loss, or explicit Close after start; same attempt ID, simulation seconds (pauses excluded), zero-based engine wave index, lives remaining, unique deployed species |
| `capture_result`     | A valid enemy's capture action was processed; species, creature level, success, attempt ID                                                                              |
| `feedback_submitted` | Optional fixed category and current menu screen; no free text                                                                                                           |
| `game_error`         | Uncaught error or unhandled rejection category and screen; at most five per page load, no messages or stacks                                                            |

All events include schema version and build version (deployment commit when
available, otherwise package version). PostHog supplies browser identity, session,
and basic device metadata. No player/profile names, save files, automatic clicks,
page views, recordings, surveys, or precise location are collected by this integration.
URL/referrer metadata is removed before sending and IP geolocation is disabled.

Only events occurring after consent are eligible. Declined/blocked/offline events
may be absent. Missing outcomes are unknown, not losses or quits. Capture failure
here means the engine rejected the action, not a probabilistic escape mechanic.
Simulation duration follows engine time and is not wall-clock engagement time.
Deployed species represent any tower present during placement/start, not damage dealt.

## First dashboards and verification

In PostHog, build a funnel from `game_started` to `level_started` to a winning
`level_finished`. Break completion and losses down by `level_id` and build version.
Count distinct `attempt_id` for attempts, not raw events. Use session/activity
cohorts for returns; a browser reset or different device creates a new identity.

Check a deployed production build: decline and confirm no PostHog requests;
enable, start a battle, capture, win/lose, and confirm the matching events in
PostHog's live events view. Close a separate battle to verify `quit`. Turn off
collection and confirm new events stop. Also test with a blocker and offline to
confirm play continues. Automated tests mock the SDK and never send live events.
Production dashboard ingestion still needs this deployed check.

Keep the account on its no-card free tier. Start with these summary events and
monitor usage before enabling any additional PostHog products.
