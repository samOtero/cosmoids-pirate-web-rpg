# Roguelite prototype

Added October 22, 2026. The mode defaults to disabled. Its shared build-time
feature flag is `NEXT_PUBLIC_ENABLE_ROGUELITE`; only the exact value `true`
enables it. Set it in `apps/web/.env.local` for local playtesting, then restart
the dev server. For deployments, set it in the desired build environment and
rebuild/redeploy. Unset, `false`, and other values leave it disabled.

When disabled, the mode card is hidden, a stale Roguelite screen selection
returns to Choose Mode, and `/roguelite` responds with a 404. When enabled,
enter through the Roguelite card on Choose Mode, or open `/roguelite` directly
to play without loading a story profile. This public availability switch is
not an account permission or a saved profile setting.

Choose a starter and a move. A Story-style Ready/GO countdown starts the run.
The shared tower buttons support dragging partners onto the map, moving and
swapping them during combat, and returning them to the tray. Click a tower
button for the shared move details and targeting menu. Dragging and move
inspection suspend combat; closing a menu preserves any manual pause.
Between cleared waves, choose one reward, then the next wave starts
automatically. The first reward always recruits a partner.
More entrances open during the run; the last wave includes an elite. Coin
carriers must leave the arena to remove a life. Defeating or disarming a
carrier restores its coin to its original stash position immediately.

The October 23 pacing pass replaces the very short opening groups with
continuous spawning for roughly 45 seconds in the first wave, increasing
toward a minute in later waves. Remaining enemies must still be resolved
before a reward appears. The final elite enters in the closing stretch.
This increases time defending between rewards without changing attack power
or adding an empty wait after a clear. These are initial playtest targets.

## Implementation boundaries

- `apps/web/src/constants/roguelite.ts` owns this mode's arena, encounters and
  temporary loadouts. Species stats remain in the ordinary species registry.
- `apps/web/src/engine/roguelite/RogueliteRun.ts` owns run state, reward drafting, and
  mode-specific combat modifiers. The battle subclass changes objective
  recovery and disables ordinary XP progression only for this mode.
- The new screen uses the existing Pixi renderer, creature sprites and attack
  visuals. The clearing background is an SVG, with no new raster masters.
- No run code imports the game store, profile client, or persistence service.
  Starting, recruiting, upgrading, quitting, winning and losing do not write
  to story profiles or cloud saves. Story and Challenge battle code and
  shared attack definitions retain their existing behavior.
- The seed reproduces reward drafting, not combat randomness. Retrying starts
  a fresh team and clears rewards. Unfinished runs are not persisted.

## Small initial content pool

Fueguana's four independent roguelite moves were added October 23, 2026:
Fire Claw (short cleaving sweeps), Cinder Spit (long-range single-target shot),
Fire Breath (fixed-direction piercing pulses), and Tail Bomb (fan lobs with
flight, fuse, and a fixed blast location). Selecting Fueguana draws two distinct
starting offers once; choosing one starts the run with only that move learned.
There is no starting Heat. The existing run escalation reward can add it later.

`apps/web/src/engine/roguelite/attacks/definitions.ts` owns the new move data,
using permanent IDs appended in `definitionIds.ts`. These IDs are absent from
the Story attack registry and ordinary learnsets. The engine and renderer use
an instance lookup whose default still resolves the original Story definitions.
Separate pattern hooks are inactive in Story and Challenge battles.

The new controller handles sweeps, directional piercing, and delayed blasts.
Cinder Spit reuses the ordinary projectile implementation with its independent
definition. Existing flame and impact visuals are reused, with procedural
effects for the new patterns; no raster artwork was added. Breath direction
can be chosen in the move menu, with a visible firing corridor. Additional
aligned placement spots support the directional pattern.

Other partners retain their existing natural moves: Barrel Bash's secondary
push, Husk Shot's bind, Venom Spray's poison and Siphon Lash's poison payoff.
Rewards do not distribute another family's signature move. Learning a second
move, forgetting, and the rare concurrency reward remain future work; this
iteration adds the four attacks and Fueguana's initial choice only. The pattern
controller supports alternating casts without canceling traveling effects.

Run-only upgrades add Water pushback, Grass openings consumed by a different
partner, Fire escalation, and repeatable damage or coverage training. Effects
follow the attack type, not the user's type. See `TYPE_AND_FAMILY_IDENTITY.md` for the
elemental direction. Numerical tuning remains experimental and lives in code.

## Verification

Controlled tests cover coin rescue versus floor drops and escapes, modifier
timing and ownership, reward consumption, recruitment limits, final-wave
completion, clean retries and unchanged authored attacks. Registry checks
should validate current references without freezing this prototype's balance.
Pattern tests use controlled geometry and timing for cleaving, targeting,
piercing, blast locations, cast turns, and independent cooldowns. UI tests
cover stable two-move offers, choice commitment, cancellation, and the other
starter flows.
Battle-flow tests cover the initial countdown, automatic continuation after a
reward, pause ownership, mouse and touch roster drags, and in-map drag pausing.
Lifecycle tests cover live swaps, reserve/redeploy state, and preserving benched
partners across rewards.

For playtesting, try every starter, prioritize different rewards, reposition
when paths open, and check whether teamwork is visible without reading damage
numbers. Use the existing attack animations and the Opening, Follow-up and
Backwash callouts to identify interactions.
