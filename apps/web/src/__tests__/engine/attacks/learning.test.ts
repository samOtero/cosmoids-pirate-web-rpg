import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { makeAttack, makeBattle } from './helpers';

const speciesId = 'test_attack_learner';
beforeEach(() => {
  COSMOID_TEMPLATES[speciesId] = {
    ...Object.values(COSMOID_TEMPLATES)[0],
    id: speciesId,
    learnableAttacks: [{ level: 5, attackId: 'TEST_PROJECTILE' }],
    evolutionNodes: [],
  };
});
afterEach(() => {
  delete COSMOID_TEMPLATES[speciesId];
});

function learner(equippedAttacks: string[]) {
  const { engine, source } = makeBattle(makeAttack(), {
    creature: {
      id: 'caster',
      speciesId,
      level: 4,
      xp: 0,
      equippedAttacks,
      isShiny: false,
    },
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
    const { engine, source, events, grantXp } = learner(['TEST_STARTER']);
    expect(source.creature.equippedAttacks).not.toContain('TEST_PROJECTILE');
    source.creature.xp = 5 ** 3 - 4 ** 3;
    grantXp();
    expect(source.creature.level).toBe(5);
    expect(source.creature.equippedAttacks).toContain('TEST_PROJECTILE');
    expect(source.equippedAttacksRuntime).toContainEqual({
      definitionId: 'TEST_PROJECTILE',
      lastFiredTime: 0,
    });
    expect(engine.roster[0].equippedAttacks).toContain('TEST_PROJECTILE');
    grantXp();
    expect(
      source.creature.equippedAttacks.filter((id) => id === 'TEST_PROJECTILE')
    ).toHaveLength(1);
    expect(
      events.filter((event) => event.type === 'TOWER_LEARNED_ATTACK')
    ).toHaveLength(1);
  });

  it('asks for a replacement when the loadout is full and applies the selected slot', () => {
    const loadout = ['TEST_A', 'TEST_B', 'TEST_C', 'TEST_D'];
    const { engine, source, events, grantXp } = learner([...loadout]);
    source.creature.xp = 5 ** 3 - 4 ** 3;
    grantXp();
    expect(source.creature.equippedAttacks).toEqual(loadout);
    expect(events).toContainEqual({
      type: 'TOWER_ASK_REPLACE_ATTACK',
      towerId: source.id,
      newAttackDefId: 'TEST_PROJECTILE',
    });
    expect(events.some((event) => event.type === 'TOWER_LEARNED_ATTACK')).toBe(
      false
    );
    engine.replaceTowerAttack(source.id, 1, 'TEST_PROJECTILE');
    expect(source.creature.equippedAttacks).toEqual([
      'TEST_A',
      'TEST_PROJECTILE',
      'TEST_C',
      'TEST_D',
    ]);
    expect(source.equippedAttacksRuntime[1]).toEqual({
      definitionId: 'TEST_PROJECTILE',
      lastFiredTime: 0,
    });
  });
});
