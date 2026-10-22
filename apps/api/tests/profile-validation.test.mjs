import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSnapshot } from '../src/profile-validation.ts';
import { loadGameContent } from '../src/game-content.ts';
import {
  makeProfile,
  makePlayerCreature,
} from './.generated/data-builders.mjs';

function input(creature, profileVersion) {
  const { id, ownerId, version, creatures, storageCreatures, ...profileData } =
    makeProfile({ creatures: [creature] });
  return {
    profileVersion,
    profileData,
    creatures: creatures.map(({ originalOwnerId, ...c }) => c),
    storageCreatures,
  };
}

test('save validation discovers every registered species and its current legal moves', async () => {
  const content = await loadGameContent();
  for (const species of content.species) {
    const attacks = [
      ...new Set(
        species.learnableAttacks
          .filter((move) => move.level <= content.maxLevel)
          .map((move) => move.attackId)
      ),
    ].slice(-4);
    const gender =
      species.genderRatio === 'genderless'
        ? 'genderless'
        : species.genderRatio.female > 0
          ? 'female'
          : 'male';
    const creature = makePlayerCreature({
      id: 'registry-' + species.id,
      speciesId: species.id,
      gender,
      level: content.maxLevel,
      equippedAttacks: attacks,
    });
    const parsed = validateSnapshot(
      input(creature, content.profileVersion),
      content
    );
    assert.equal(parsed.creatures[0].speciesId, species.id);
  }
});

test('evolved creatures retain ancestor moves, while future, unrelated and unknown moves are rejected', () => {
  // Controlled content tests the rule independently of authored balance values.
  const content = {
    profileVersion: 1,
    maxLevel: 20,
    maxPartySize: 6,
    maxProfiles: 3,
    gameFlags: [],
    storyProgressions: [0],
    attackIds: [11, 12, 13],
    species: [
      {
        id: 1,
        genderRatio: 'genderless',
        learnableAttacks: [{ level: 1, attackId: 11 }],
        evolutionNodes: [{ level: 5, evolutionDefId: 2 }],
      },
      {
        id: 2,
        genderRatio: 'genderless',
        learnableAttacks: [
          { level: 5, attackId: 12 },
          { level: 10, attackId: 13 },
        ],
        evolutionNodes: [],
      },
    ],
  };
  const creature = makePlayerCreature({
    id: 'evolved',
    speciesId: 2,
    gender: 'genderless',
    level: 5,
    equippedAttacks: [11, 12],
  });
  assert.doesNotThrow(() => validateSnapshot(input(creature, 1), content));
  for (const moves of [[13], [999]])
    assert.throws(
      () =>
        validateSnapshot(
          input({ ...creature, equippedAttacks: moves }, 1),
          content
        ),
      { code: 'INVALID_SAVE' }
    );
  assert.throws(
    () =>
      validateSnapshot(
        input({ ...creature, speciesId: 1, equippedAttacks: [12] }, 1),
        content
      ),
    { code: 'INVALID_SAVE' }
  );
});
