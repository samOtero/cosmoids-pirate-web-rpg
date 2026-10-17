# Creature and attack definition IDs

The permanent numeric assignments live in `apps/web/src/types/definitionIds.ts`.
Use named constants such as `SpeciesId.PALMIT` and `AttackId.PINCH` in authored content and code. The creature and attack registries still own their gameplay data.

Append an explicit positive safe integer when adding a definition. Never renumber existing assignments, derive an ID from registry order, or reuse a retired ID. Keep retired assignments reserved; if a definition is removed, retain an explicit retirement record and update validation deliberately. Names may change without changing the number. Species and attacks have separate ID spaces.

Saved species references, equipped attacks, capture history, evolution targets, learnsets, level rosters, runtime definitions and related events use numbers. Convert HTML select values with `Number(value)` at the input boundary. Object keys returned by `Object.entries` are strings even for numeric registries; prefer registry values when collecting IDs.

Individual creature instance IDs and account owner IDs remain strings. So do level-local encounter IDs, enemy ability names, behavior discriminators, poison identities and artwork keys. Creature `visualConfigId` connects a species to its existing battle artwork; visual editors continue saving by this named key.

Registries validate their assignments on loading, rejecting duplicate or invalid IDs, missing definitions and mismatched keys. Registry tests discover content and validate its references. Controlled mechanic tests can use `testDefinitionId(label)` from the shared test builders; it is a test fixture helper, never a production allocation strategy.

Profile version 12 resets saves from the former string-definition format. There is no migration. Future published ID changes must account for persisted saves and server references.
