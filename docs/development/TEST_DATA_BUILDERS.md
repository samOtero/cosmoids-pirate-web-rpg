# Test data builders

Use `makePlayerCreature` and `makeProfile` from
`apps/web/src/__tests__/utils/dataBuilders.ts` to create ordinary creature and
save inputs. The builders return the required production types, so a new required
field usually needs a default in one place instead of edits throughout the tests.
Production fields remain required.

```ts
const creature = makePlayerCreature({
  id: 'caster',
  speciesId: testSpecies.id,
  level: 10,
  equippedAttacks: [testAttack.id],
});

const profile = makeProfile({
  creatures: [creature],
  storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
});
```

Creature instance IDs and species IDs are mandatory. Choose distinct instance
IDs when a test needs multiple creatures. Register controlled species for engine
mechanics, or discover a current registry entry when testing content integration.
The builders do not register species, infer moves, generate random identities,
or copy production tuning. Levels, moves, genders, owners, and other fields
important to a scenario should be explicit overrides in that scenario.

The shared defaults include guest ownership and neutral saved-creature state.
Profiles default to the current save version. Every call creates fresh mutable
collections; supplied move arrays, party/storage creatures, inventory items,
flags, and capture history are copied so one test setup cannot mutate another.
The builders have no React or game-store dependency and can be used by pure
engine tests and UI tests alike.

For browser tests, build the typed profile in the test process and pass that
serializable object to `page.addInitScript`. The browser callback should only
write the supplied profile to storage; do not duplicate model construction
inside the callback, where the builders cannot be imported.

Use small scenario helpers around these builders where useful, such as making
several creatures for a roster. Do not duplicate the complete model in those
helpers. Shared battle helpers should also use these builders for their owned
creatures.

Keep raw old-version save payloads, malformed data, and intentionally incomplete
acquisition inputs explicit. A current-version builder could silently repair or
change the exact condition those tests are supposed to exercise. Ownership
tests should specify the owner identities they test; gender tests should specify
their gender inputs rather than relying on a shared default.

Keep assertions about outcomes and relevant relationships. Do not use a builder
to manufacture the expected complete output of production creation or save code;
that can hide a defect shared by the setup and expectation. Registry validation
continues to discover authored entries rather than maintaining a second content
inventory in fixtures.
