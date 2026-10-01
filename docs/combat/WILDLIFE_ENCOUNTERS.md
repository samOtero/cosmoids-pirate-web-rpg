# Weighted wildlife encounters

Level wave groups can supply an `encounterPool` to roll an enemy independently
at each scheduled spawn. Each entry references a level-scoped enemy definition
and supplies a positive `weight`. Its chance is its weight divided by the total
pool weight; weights do not need to add up to 100. A pool replaces the group's
fixed enemy. Without a pool, existing fixed waves behave as before.

An entry may override `pathIndex` to put wildlife on its appropriate route.
Otherwise it follows the group path. Counts, intervals, delays, capture
restrictions, and other group behavior still apply. Selected definitions own
the encounter level and battlefield modifiers; captures use the selected
species and level through the normal capture flow.

Level 7 uses this mechanism for a finite island wildlife visit. A wave's
`repeatCount` includes its first run. `delayBetweenRepeatsMs` sets the pause from
the end of spawning to the earliest spawn of the next run; concurrent opening
groups retain their relative delays. Sequential group delays remain unchanged.
Repeats are expanded at runtime, keeping the authored wave and pool editable.
There is no HP or count escalation. The visit completes when the final wildlife
clears, and Close can complete it early. Each arrival is a new roll, so a visit
does not guarantee every species.
Its roster, weights, and routes are authored only in
`apps/web/src/constants/tdLevels/level7.ts`.

The level editor's Waves tab supports pool entries, relative weights, displayed
percentages, and route overrides. Removing all entries restores fixed spawns.
Saving validates weights and references through the existing source revision
protocol. Level selection includes every species in the pool.
