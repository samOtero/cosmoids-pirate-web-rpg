# Creature gender

Gender is an individual identity detail. Species probabilities are authored only
in `apps/web/src/constants/creatures.ts` through `CosmoidTemplate.genderRatio`.
The `female` value is a probability from zero to one; `'genderless'` represents
a species outside male/female classification.

Creation uses `creatureGender.ts`. Save records require `PlayerCreature.gender`,
and runtime resolution copies it. Capture, evolution, party/storage transfers,
and battle updates preserve the individual's existing value. Gender does not
change stats, art, moves, or evolution eligibility.

For a fixed boss or story encounter, set the optional `gender` on its
`TDWaveEnemyDefinition`, or use the Gender selector in the level editor's Enemy
Definitions section. An omitted value rolls independently for each spawned
creature. A definition with `gender: 'male'`, for example, produces males on
every use, including repeated waves. Use separate definitions when the same
species needs different identities in different encounters. Structures have no
gender, and overrides must be compatible with the species classification.
Enemy transformations preserve the existing individual rather than applying a
new spawn override.

The October 12, 2026 introduction accompanies profile version 10. Older profiles
reset through the existing hydration and selection paths, retaining their slot
and name. The new schema therefore does not backfill old creatures.
