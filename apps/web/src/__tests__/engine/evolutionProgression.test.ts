import { AttackId } from '@/types/definitionIds';
import {
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { beforeEach, describe, expect, it } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { calculateMaxHp, calculateStat } from '@/utils/resolvePlayerCreature';
import { ElementType } from '@/types/baseGame';
import { battle, species } from './behaviorFixtures';

const baseId = testDefinitionId('test_evolution_base');
const evolvedId = testDefinitionId('test_evolution_middle');
const finalId = testDefinitionId('test_evolution_final');
const rewardId = testDefinitionId('test_evolution_reward');
const threshold = 5;
const evolutionMove = testDefinitionId('TEST_EVOLUTION_MOVE');
beforeEach(() => {
  species(baseId, {
    evolutionNodes: [{ level: threshold, evolutionDefId: evolvedId }],
  });
  species(evolvedId, {
    type: ElementType.WATER,
    secondaryType: ElementType.FLYING,
    baseStats: {
      hp: 100,
      attack: 90,
      specialAttack: 80,
      defense: 70,
      specialDefense: 65,
      speed: 75,
    },
    learnableAttacks: [{ level: threshold, attackId: evolutionMove }],
    evolutionNodes: [{ level: threshold + 2, evolutionDefId: finalId }],
  });
  species(finalId);
  species(rewardId); // Zero base experience gives exactly one XP per reward.
});

function createLearner(
  level = threshold - 1,
  equippedAttacks: AttackId[] = [testDefinitionId('TEST_STARTER')]
) {
  const creature = makePlayerCreature({
    originalOwnerId: 'test-original-account',
    id: 'learner',
    speciesId: baseId,
    level,
    equippedAttacks,
  });
  const engine = battle({}, [creature]);
  expect(engine.placeTower(creature.id, 25, 25)).toBe(true);
  const tower = engine.towers[0];
  const events: TDEvent[] = [];
  engine.events.subscribe((event) => events.push(event));
  const reward = () =>
    engine.events.emit({
      type: 'ENEMY_DIED',
      enemyId: 'reward',
      enemyDefinitionId: rewardId,
      enemyLevel: 1,
      participantTowerIds: [tower.id],
    });
  const levelUp = () => {
    tower.creature.xp =
      (tower.creature.level + 1) ** 3 - tower.creature.level ** 3 - 1;
    reward();
  };
  return { engine, tower, events, reward, levelUp };
}

describe('Shared evolution progression', () => {
  it('rejects evolution before the configured threshold or without a pending choice', () => {
    const { engine, tower, events, reward } = createLearner(threshold - 2);
    reward();
    expect(events.some((event) => event.type === 'TOWER_ASK_EVOLUTION')).toBe(
      false
    );
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(false);
    expect(tower.creature.speciesId).toBe(baseId);
  });
  it('offers at the threshold, preserves the species until accepted, and avoids duplicate prompts', () => {
    const { engine, tower, events, reward, levelUp } = createLearner();
    levelUp();
    expect(tower.creature.level).toBe(threshold);
    expect(tower.creature.speciesId).toBe(baseId);
    expect(events).toContainEqual({
      type: 'TOWER_ASK_EVOLUTION',
      towerId: tower.id,
      oldDefinitionId: baseId,
      newDefinitionId: evolvedId,
    });
    reward();
    levelUp();
    expect(
      events.filter((event) => event.type === 'TOWER_ASK_EVOLUTION')
    ).toHaveLength(1);
    expect(engine.evolveTower(tower.id, finalId)).toBe(false);
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(true);
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(false);
    expect(engine.roster[0].speciesId).toBe(evolvedId);
    expect(engine.roster[0].gender).toBe(tower.creature.gender);
    expect(tower.creature.gender).toBe('female');
  });
  it('reconsiders a canceled evolution only after another level-up', () => {
    const { engine, tower, events, reward, levelUp } = createLearner();
    levelUp();
    expect(engine.cancelTowerEvolution(tower.id)).toBe(true);
    expect(engine.cancelTowerEvolution(tower.id)).toBe(false);
    reward();
    expect(
      events.filter((event) => event.type === 'TOWER_ASK_EVOLUTION')
    ).toHaveLength(1);
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(false);
    levelUp();
    expect(
      events.filter((event) => event.type === 'TOWER_ASK_EVOLUTION')
    ).toHaveLength(2);
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(true);
  });
  it('teaches the evolved species threshold move only after the species swap and evolution event', () => {
    const { engine, tower, events, levelUp } = createLearner();
    levelUp();
    expect(tower.creature.equippedAttacks).not.toContain(evolutionMove);
    expect(events.some((event) => event.type === 'TOWER_LEARNED_ATTACK')).toBe(
      false
    );
    let speciesAtLearning: number | undefined;
    engine.events.subscribe((event) => {
      if (event.type === 'TOWER_LEARNED_ATTACK')
        speciesAtLearning = tower.creature.speciesId;
    });
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(true);
    expect(speciesAtLearning).toBe(evolvedId);
    expect(tower.equippedAttacksRuntime).toContainEqual({
      definitionId: evolutionMove,
      lastFiredTime: 0,
    });
    expect(
      events.findIndex((event) => event.type === 'TOWER_LEARNED_ATTACK')
    ).toBeGreaterThan(
      events.findIndex((event) => event.type === 'TOWER_EVOLVED')
    );
  });
  it('requests a move replacement after evolution when the loadout is full', () => {
    const loadout = [
      testDefinitionId('TEST_A'),
      testDefinitionId('TEST_B'),
      testDefinitionId('TEST_C'),
      testDefinitionId('TEST_D'),
    ];
    const { engine, tower, events, levelUp } = createLearner(threshold - 1, [
      ...loadout,
    ]);
    levelUp();
    engine.evolveTower(tower.id, evolvedId);
    expect(tower.creature.equippedAttacks).toEqual(loadout);
    expect(events).toContainEqual({
      type: 'TOWER_ASK_REPLACE_ATTACK',
      towerId: tower.id,
      newAttackDefId: evolutionMove,
    });
    expect(
      events.findIndex((event) => event.type === 'TOWER_ASK_REPLACE_ATTACK')
    ).toBeGreaterThan(
      events.findIndex((event) => event.type === 'TOWER_EVOLVED')
    );
  });
  it('updates combat stats from the evolved template and preserves the defense buff', () => {
    const { engine, tower, levelUp } = createLearner();
    levelUp();
    tower.hp = 1;
    tower.defenseBoostMultiplier = 1.5;
    engine.evolveTower(tower.id, evolvedId);
    const stats = COSMOID_TEMPLATES[evolvedId].baseStats;
    expect(tower.currentAttack).toBe(
      calculateStat(stats.attack, tower.creature.level)
    );
    expect(tower.currentSpecialAttack).toBe(
      calculateStat(stats.specialAttack, tower.creature.level)
    );
    expect(tower.currentDefense).toBe(
      calculateStat(stats.defense, tower.creature.level) * 1.5
    );
    expect(tower.currentSpecialDefense).toBe(
      calculateStat(stats.specialDefense, tower.creature.level)
    );
    expect(tower.maxHp).toBe(calculateMaxHp(stats.hp, tower.creature.level));
    expect(tower.hp).toBe(tower.maxHp);
  });
  it('offers the next evolution when accepting a delayed evolution after both thresholds', () => {
    const { engine, tower, events, levelUp } = createLearner();
    const originalOwnerId = tower.creature.originalOwnerId;
    levelUp();
    levelUp();
    levelUp();
    expect(engine.evolveTower(tower.id, evolvedId)).toBe(true);
    expect(tower.creature.originalOwnerId).toBe(originalOwnerId);
    expect(events.at(-1)).toEqual({
      type: 'TOWER_ASK_EVOLUTION',
      towerId: tower.id,
      oldDefinitionId: evolvedId,
      newDefinitionId: finalId,
    });
    expect(engine.evolveTower(tower.id, finalId)).toBe(true);
    expect(tower.creature.originalOwnerId).toBe(originalOwnerId);
  });
});
