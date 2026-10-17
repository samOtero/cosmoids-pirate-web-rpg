import {
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { describe, expect, it } from 'vitest';
import { MAX_PARTY_SIZE } from '@/constants/game';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';
import type { PlayerCreature } from '@/types/baseGame';
import { battle, battleSpecies } from './behaviorFixtures';

function encounter(roster: PlayerCreature[] = [], ownerId?: string) {
  const template = battleSpecies(testDefinitionId('ownership-encounter'));
  const engine = battle(
    {
      waveEnemyDefinitions: [{ id: 'wild', creatureId: template.id, level: 1 }],
      waves: [
        {
          id: 'capture-wave',
          groups: [
            {
              enemyDefinitionId: 'wild',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    },
    roster,
    ownerId
  );
  engine.tick(0, 16);
  return engine;
}

describe('captured creature ownership', () => {
  it.each([undefined, 'capturing-account'])(
    'records battle owner %s on the capture and its roster copy',
    (ownerId) => {
      const engine = encounter([], ownerId);
      const captured = engine.captureEnemy(engine.enemies[0].id)!;
      expect(captured).not.toBeNull();
      expect(captured.originalOwnerId).toBe(ownerId ?? GUEST_OWNER_ID);
      expect(
        engine.roster.find((creature) => creature.id === captured.id)
      ).toMatchObject({ originalOwnerId: captured.originalOwnerId });
    }
  );

  it('records the account owner even when the capture cannot join the battle roster', () => {
    const roster: PlayerCreature[] = Array.from(
      { length: MAX_PARTY_SIZE },
      (_, index) =>
        makePlayerCreature({
          id: `party-${index}`,
          originalOwnerId: 'another-original-owner',
          speciesId: testDefinitionId('ownership-encounter'),
          level: 1,
          equippedAttacks: [],
        })
    );
    const engine = encounter(roster, 'capturing-account');
    const captured = engine.captureEnemy(engine.enemies[0].id)!;
    expect(captured).not.toBeNull();
    expect(captured.originalOwnerId).toBe('capturing-account');
    expect(engine.roster).toHaveLength(MAX_PARTY_SIZE);
    expect(
      engine.roster.every(
        (creature) => creature.originalOwnerId === 'another-original-owner'
      )
    ).toBe(true);
  });
});
