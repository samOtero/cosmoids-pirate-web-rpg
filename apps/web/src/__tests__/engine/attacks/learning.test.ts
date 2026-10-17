import type { AttackId } from '@/types/definitionIds';
import {
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { makeAttack, makeBattle } from './helpers';

const speciesId = testDefinitionId('test_attack_learner');
beforeEach(() => {
  COSMOID_TEMPLATES[speciesId] = {
    ...Object.values(COSMOID_TEMPLATES)[0],
    id: speciesId,
    learnableAttacks: [
      { level: 5, attackId: testDefinitionId('TEST_PROJECTILE') },
    ],
    evolutionNodes: [],
  };
});
afterEach(() => {
  delete COSMOID_TEMPLATES[speciesId];
});

function learner(equippedAttacks: AttackId[]) {
  const { engine, source } = makeBattle(makeAttack(), {
    creature: makePlayerCreature({
      id: 'caster',
      speciesId,
      level: 4,
      equippedAttacks,
    }),
    equippedAttacksRuntime: equippedAttacks.map((definitionId) => ({
      definitionId,
      lastFiredTime: 0,
    })),
  });
  engine.roster = [source.creature];
  const events: TDEvent[] = [];
  engine.events.subscribe((event) => events.push(event));
  const grantXp = () =>
    engine.events.emit({
      type: 'ENEMY_DIED',
      enemyId: 'defeated',
      enemyDefinitionId: 'test_defender',
      enemyLevel: 1,
      participantTowerIds: [source.id],
    });
  return { engine, source, events, grantXp };
}

describe('Shared attack learning', () => {
  it('learns at the configured threshold and adds one runtime entry and notification', () => {
    const { engine, source, events, grantXp } = learner([
      testDefinitionId('TEST_STARTER'),
    ]);
    expect(source.creature.equippedAttacks).not.toContain(
      testDefinitionId('TEST_PROJECTILE')
    );
    source.creature.xp = 5 ** 3 - 4 ** 3;
    grantXp();
    expect(source.creature.level).toBe(5);
    expect(source.creature.equippedAttacks).toContain(
      testDefinitionId('TEST_PROJECTILE')
    );
    expect(source.equippedAttacksRuntime).toContainEqual({
      definitionId: testDefinitionId('TEST_PROJECTILE'),
      lastFiredTime: 0,
    });
    expect(engine.roster[0].equippedAttacks).toContain(
      testDefinitionId('TEST_PROJECTILE')
    );
    grantXp();
    expect(
      source.creature.equippedAttacks.filter(
        (id) => id === testDefinitionId('TEST_PROJECTILE')
      )
    ).toHaveLength(1);
    expect(
      events.filter((event) => event.type === 'TOWER_LEARNED_ATTACK')
    ).toHaveLength(1);
  });

  it('asks for a replacement when the loadout is full and applies the selected slot', () => {
    const loadout = [
      testDefinitionId('TEST_A'),
      testDefinitionId('TEST_B'),
      testDefinitionId('TEST_C'),
      testDefinitionId('TEST_D'),
    ];
    const { engine, source, events, grantXp } = learner([...loadout]);
    source.creature.xp = 5 ** 3 - 4 ** 3;
    grantXp();
    expect(source.creature.equippedAttacks).toEqual(loadout);
    expect(events).toContainEqual({
      type: 'TOWER_ASK_REPLACE_ATTACK',
      towerId: source.id,
      newAttackDefId: testDefinitionId('TEST_PROJECTILE'),
    });
    expect(events.some((event) => event.type === 'TOWER_LEARNED_ATTACK')).toBe(
      false
    );
    engine.replaceTowerAttack(
      source.id,
      1,
      testDefinitionId('TEST_PROJECTILE')
    );
    expect(source.creature.equippedAttacks).toEqual([
      testDefinitionId('TEST_A'),
      testDefinitionId('TEST_PROJECTILE'),
      testDefinitionId('TEST_C'),
      testDefinitionId('TEST_D'),
    ]);
    expect(source.equippedAttacksRuntime[1]).toEqual({
      definitionId: testDefinitionId('TEST_PROJECTILE'),
      lastFiredTime: 0,
    });
  });
});
