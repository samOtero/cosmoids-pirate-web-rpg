import { describe, expect, it } from 'vitest';

import {
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
} from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { PlayerCreature } from '@/types/baseGame';

function createEngine(speciesId: string, level: number, xp: number) {
  const creature: PlayerCreature = {
    id: `${speciesId}_player`,
    speciesId,
    level,
    xp,
    equippedAttacks: ['TACKLE', 'STRING_SHOT'],
    isShiny: false,
  };
  const engine = new TowerDefenseEngine(
    { paths: [], placementSpots: [], waves: [] },
    [creature]
  );
  engine.placeTower(creature.id, 25, 25);
  return engine;
}

function grantBattleExperience(engine: TowerDefenseEngine) {
  const tower = engine.towers[0];
  engine.events.emit({
    type: 'ENEMY_DIED',
    enemyId: 'defeated_bug',
    enemyDefinitionId: 'bug_stage_1',
    enemyLevel: 1,
    participantTowerIds: [tower.id],
  });
}

describe('Bug evolution progression', () => {
  it('defines the level 7 and level 10 evolution thresholds', () => {
    expect(BUG_STAGE_1.evolutionNodes).toEqual([
      { level: 7, evolutionDefId: 'bug_stage_2' },
    ]);
    expect(BUG_STAGE_2.evolutionNodes).toEqual([
      { level: 10, evolutionDefId: 'bug_stage_3' },
    ]);
  });

  it('offers Sailkworm evolution at level 7 and retries after cancellation on the next level-up', () => {
    const engine = createEngine('bug_stage_1', 6, 126);
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));

    grantBattleExperience(engine);

    const tower = engine.towers[0];
    expect(tower.creature.level).toBe(7);
    expect(tower.creature.speciesId).toBe('bug_stage_1');
    expect(events).toContainEqual({
      type: 'TOWER_ASK_EVOLUTION',
      towerId: tower.id,
      oldDefinitionId: 'bug_stage_1',
      newDefinitionId: 'bug_stage_2',
    });

    expect(engine.cancelTowerEvolution(tower.id)).toBe(true);
    tower.creature.xp = 168;
    grantBattleExperience(engine);

    expect(tower.creature.level).toBe(8);
    expect(
      events.filter((event) => event.type === 'TOWER_ASK_EVOLUTION')
    ).toHaveLength(2);
    expect(engine.evolveTower(tower.id, 'bug_stage_2')).toBe(true);
    expect(tower.creature.speciesId).toBe('bug_stage_2');
    expect(engine.roster[0].speciesId).toBe('bug_stage_2');

    engine.destroy();
  });

  it('offers Cocoonot evolution at level 10', () => {
    const engine = createEngine('bug_stage_2', 9, 270);
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));

    grantBattleExperience(engine);

    const tower = engine.towers[0];
    expect(tower.creature.level).toBe(10);
    expect(tower.creature.speciesId).toBe('bug_stage_2');
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'TOWER_ASK_EVOLUTION',
        newDefinitionId: 'bug_stage_3',
      })
    );

    expect(engine.cancelTowerEvolution(tower.id)).toBe(true);

    engine.destroy();
  });

  it('teaches Mainscale its level-10 attack only after evolution', () => {
    const engine = createEngine('bug_stage_2', 9, 270);
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));

    grantBattleExperience(engine);

    const tower = engine.towers[0];
    expect(tower.creature.level).toBe(10);
    expect(tower.creature.equippedAttacks).not.toContain('SAILCUTTER');
    expect(events.some((event) => event.type === 'TOWER_LEARNED_ATTACK')).toBe(
      false
    );

    expect(engine.evolveTower(tower.id, 'bug_stage_3')).toBe(true);

    expect(tower.creature.speciesId).toBe(BUG_STAGE_3.id);
    expect(tower.creature.equippedAttacks).toContain('SAILCUTTER');
    expect(tower.equippedAttacksRuntime).toContainEqual({
      definitionId: 'SAILCUTTER',
      lastFiredTime: 0,
    });

    const evolutionEventIndex = events.findIndex(
      (event) => event.type === 'TOWER_EVOLVED'
    );
    const learnedEventIndex = events.findIndex(
      (event) =>
        event.type === 'TOWER_LEARNED_ATTACK' &&
        event.attackDefId === 'SAILCUTTER'
    );
    expect(evolutionEventIndex).toBeGreaterThanOrEqual(0);
    expect(learnedEventIndex).toBeGreaterThan(evolutionEventIndex);

    engine.destroy();
  });
});
