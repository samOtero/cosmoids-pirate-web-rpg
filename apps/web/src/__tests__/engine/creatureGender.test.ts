import { describe, expect, it, vi } from 'vitest';
import { battle, battleSpecies } from './behaviorFixtures';
import type { CreatureGender } from '@/types/baseGame';
import {
  validateTDLevelDraft,
  prepareTDLevelDraftForSave,
} from '@/utils/tdLevelDraft';
import type { TDLevelData } from '@/engine/tower-defense/types';

function encounter(gender?: CreatureGender): TDLevelData {
  return {
    paths: [
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      { id: 'encounter', creatureId: 'gender-test', level: 3, gender },
    ],
    waves: [
      {
        id: 'wave',
        groups: [
          {
            enemyDefinitionId: 'encounter',
            count: 2,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
        ],
      },
    ],
  };
}

describe('encounter gender identity', () => {
  it('rolls independently for each spawn and preserves gender through capture', () => {
    battleSpecies('gender-test', { genderRatio: { female: 0.5 } });
    const engine = battle(encounter());
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      engine.tick(0, 16);
      const first = engine.enemies[0];
      expect(first.gender).toBe('female');
      random.mockReturnValue(0.99);
      engine.tick(16, 16);
      const second = engine.enemies.find((enemy) => enemy.id !== first.id)!;
      expect(second.gender).toBe('male');
      const captured = engine.captureEnemy(first.id)!;
      expect(captured.gender).toBe(first.gender);
      expect(engine.roster.find((pc) => pc.id === captured.id)?.gender).toBe(
        first.gender
      );
    } finally {
      random.mockRestore();
    }
  });

  it.each(['male', 'female', 'genderless'] as const)(
    'honors a fixed %s encounter and captures that identity',
    (gender) => {
      battleSpecies('gender-test', {
        genderRatio: gender === 'genderless' ? 'genderless' : { female: 0.5 },
      });
      const engine = battle(encounter(gender));
      engine.tick(0, 16);
      expect(engine.enemies[0].gender).toBe(gender);
      expect(engine.captureEnemy(engine.enemies[0].id)?.gender).toBe(gender);
    }
  );

  it('validates and retains overrides in level drafts', () => {
    battleSpecies('gender-test', { genderRatio: { female: 0.5 } });
    const draft = encounter('male');
    expect(validateTDLevelDraft(draft)).toEqual([]);
    expect(
      prepareTDLevelDraftForSave(draft).waveEnemyDefinitions[0].gender
    ).toBe('male');
    draft.waveEnemyDefinitions[0].gender = 'genderless';
    expect(validateTDLevelDraft(draft)).toContain(
      'Enemy definition 1 has an invalid gender override for its species.'
    );
  });
});
