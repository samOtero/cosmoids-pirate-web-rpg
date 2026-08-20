import { describe, expect, it } from 'vitest';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { LEVEL_4 } from '@/constants/tdLevels/level4';
import { VANE_LEVEL } from '@/constants/tdLevels/vaneLevel';
import {
  TD_CREATURE_DEFS,
  TowerDefenseEngine,
} from '@/engine/tower-defense/TowerDefenseEngine';
import {
  calculateMaxHp,
  calculateStat,
  resolvePlayerCreature,
} from '@/utils/resolvePlayerCreature';
import {
  DialogContext,
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';

describe('Tower defense rules', () => {
  it('always opens Level 2 with its full bottom-to-top camera tour', () => {
    expect(FOREST_LEVEL.openingPan).toEqual({
      fromOffsetY: 100,
      durationMs: 2000,
    });
  });

  it('keeps separate path backgrounds for Levels 2 and 3', () => {
    expect(FOREST_LEVEL.backgroundUrl).toBe(
      '/battles/bg/bg_coastal_island_battle_path_v2.png'
    );
    expect(VANE_LEVEL.backgroundUrl).toBe(
      '/battles/bg/bg_coastal_island_battle_path_level_3.png'
    );
  });

  it('derives one life from each capture objective', () => {
    const engine = new TowerDefenseEngine(FOREST_LEVEL);

    expect(engine.hasCaptureUnitsGoal).toBe(true);
    expect(engine.captureUnits.length).toBeGreaterThan(0);
    expect(engine.lives).toBe(engine.captureUnits.length);

    engine.destroy();
  });

  it("starts Level 2 with Kip's fixed Mopup beside him", () => {
    const engine = new TowerDefenseEngine(FOREST_LEVEL);
    const mopup = engine.towers.find(
      (tower) => tower.creature.id === 'kip_mopup'
    );

    expect(mopup).toMatchObject({
      position: { x: 48.5, y: 51.5 },
      isFixed: true,
      receivesExperience: false,
      creature: {
        speciesId: 'mopup',
        level: 3,
        equippedAttacks: ['TACKLE'],
      },
      selectedAttackIndex: 0,
    });
    expect(engine.roster).not.toContainEqual(
      expect.objectContaining({ id: 'kip_mopup' })
    );

    expect(engine.removeTower('kip_mopup')).toBe(false);
    expect(engine.placeTower('kip_mopup', 52.12, 67.3)).toBe(false);
    expect(mopup?.position).toEqual({ x: 48.5, y: 51.5 });

    engine.destroy();
  });

  it("makes Level 3 a Bug Cosmoid attack on Caleb and Kip's boat", () => {
    const engine = new TowerDefenseEngine(VANE_LEVEL);
    const definitionsById = new Map(
      VANE_LEVEL.waveEnemyDefinitions.map((definition) => [
        definition.id,
        definition,
      ])
    );
    const creatureIds = VANE_LEVEL.waves.flatMap((wave) =>
      wave.groups.map(
        (group) => definitionsById.get(group.enemyDefinitionId)?.creatureId
      )
    );

    expect(VANE_LEVEL.captureUnits).toEqual([]);
    expect(engine.hasCaptureUnitsGoal).toBe(false);
    expect(engine.lives).toBe(10);
    expect(VANE_LEVEL.environmentUnits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tdConfigId: 'rebuilt_boat' }),
        expect.objectContaining({ tdConfigId: 'caleb_battle' }),
        expect.objectContaining({ tdConfigId: 'kip_battle' }),
        expect.objectContaining({ tdConfigId: 'captain_vane_battle' }),
      ])
    );
    expect(new Set(creatureIds)).toEqual(new Set(['bug_stage_1', 'bettle']));
    expect(definitionsById.get('vane_bettle_guard')).toEqual(
      expect.objectContaining({ goalDamage: 10 })
    );

    const beetadelGroups = VANE_LEVEL.waves.flatMap((wave) =>
      wave.groups.filter(
        (group) => group.enemyDefinitionId === 'vane_bettle_guard'
      )
    );
    expect(beetadelGroups).toEqual([
      expect.objectContaining({ count: 1, uncapturable: true }),
    ]);

    engine.destroy();
  });

  it("prevents Vane's owned Beetadel from being captured", () => {
    const beetadelGroup = VANE_LEVEL.waves
      .flatMap((wave) => wave.groups)
      .find((group) => group.enemyDefinitionId === 'vane_bettle_guard');
    expect(beetadelGroup).toBeDefined();

    const engine = new TowerDefenseEngine({
      ...VANE_LEVEL,
      waves: [
        {
          id: 'owned_beetadel_test',
          groups: [
            {
              ...beetadelGroup!,
              spawnIntervalMs: 1,
              delayBeforeGroupMs: 0,
            },
          ],
        },
      ],
    });

    engine.tick(1, 1);

    expect(engine.enemies).toHaveLength(1);
    expect(engine.enemies[0]).toMatchObject({
      definitionId: 'bettle',
      uncapturable: true,
    });
    expect(engine.captureEnemy(engine.enemies[0].id)).toBeNull();

    engine.destroy();
  });

  it('unlocks the playable Level 3 intro after completing Level 2', () => {
    expect(LEVEL_ORDER[2]).toMatchObject({
      context: TDLevelContext.VANE_LEVEL_3,
      requiredProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
    });
    expect(TD_LEVELS[TDLevelContext.VANE_LEVEL_3].introEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_3_INTRO },
      },
    ]);
  });

  it("shows Level 3's endings and unlocks Kip's Journal only after a win", () => {
    expect(TD_LEVELS[TDLevelContext.VANE_LEVEL_3].winEvents).toEqual([
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_BUG_STAGE_2 },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_3_WIN },
      },
      { type: 'GO_TO_LEVEL_SELECT' },
    ]);
    expect(
      TD_LEVELS[TDLevelContext.VANE_LEVEL_3].journalCompletion?.seenSpeciesIds
    ).toEqual(['bug_stage_1', 'bettle']);
    expect(TD_LEVELS[TDLevelContext.VANE_LEVEL_3].loseEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_3_LOSE },
      },
      { type: 'GO_TO_LEVEL_SELECT' },
    ]);
  });

  it('sets up Level 4 with a self-returning objective and no story dialogs', () => {
    expect(LEVEL_4.paths).toEqual(VANE_LEVEL.paths);
    expect(LEVEL_4.backgroundUrl).toBe(VANE_LEVEL.backgroundUrl);
    expect(LEVEL_4.captureUnits).toEqual([
      expect.objectContaining({
        tdConfigId: 'map_1',
        position: VANE_LEVEL.paths[0][VANE_LEVEL.paths[0].length - 1],
        returnHome: { pathIndex: 0, speed: 2, delayMs: 500 },
      }),
    ]);
    expect(
      LEVEL_4.waves.every((wave) =>
        wave.groups.every((group) => group.turnAroundAtEnd)
      )
    ).toBe(true);
    const level4Engine = new TowerDefenseEngine(LEVEL_4);
    expect(level4Engine.hasCaptureUnitsGoal).toBe(true);
    expect(level4Engine.lives).toBe(1);
    level4Engine.destroy();
    expect(LEVEL_ORDER[3]).toMatchObject({
      context: TDLevelContext.LEVEL_4,
      requiredProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_4]).toMatchObject({
      levelData: LEVEL_4,
      winEvents: [
        {
          type: 'SET_STORY_PROGRESSION',
          payload: { progression: StoryProgression.DEFEAT_LEVEL_4 },
          autoProceed: true,
        },
        { type: 'GO_TO_LEVEL_SELECT' },
      ],
      loseEvents: [{ type: 'GO_TO_LEVEL_SELECT' }],
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_4].introEvents).toBeUndefined();
    expect(
      TD_LEVELS[TDLevelContext.LEVEL_4].winEvents.some(
        (event) => event.type === 'SHOW_DIALOG'
      )
    ).toBe(false);
    expect(
      TD_LEVELS[TDLevelContext.LEVEL_4].loseEvents.some(
        (event) => event.type === 'SHOW_DIALOG'
      )
    ).toBe(false);
  });

  it('automatically prevents cursed enemies from being captured', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'cursed_senticle',
          creatureId: 'senticle',
          level: 15,
        },
      ],
      waves: [
        {
          id: 'cursed_test',
          groups: [
            {
              enemyDefinitionId: 'cursed_senticle',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              isCursed: true,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    expect(engine.enemies).toHaveLength(1);
    expect(engine.enemies[0]).toMatchObject({
      isCursed: true,
      uncapturable: true,
    });
    expect(engine.captureEnemy(engine.enemies[0].id)).toBeNull();

    engine.destroy();
  });

  it('applies enemy-definition stat multipliers only to battlefield stats', () => {
    const enemyLevel = 3;
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      enemyHpMultiplier: 2,
      waveEnemyDefinitions: [
        {
          id: 'armored_mouse',
          creatureId: 'mouse_1',
          level: enemyLevel,
          hpMultiplier: 3,
          defenseMultiplier: 2.5,
          specialDefenseMultiplier: 3,
        },
      ],
      waves: [
        {
          id: 'hp_multiplier_test',
          groups: [
            {
              enemyDefinitionId: 'armored_mouse',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    const enemy = engine.enemies[0];
    const normalEnemyHp = calculateMaxHp(
      TD_CREATURE_DEFS.mouse_1.baseCreature.maxHp,
      enemyLevel
    );
    expect(enemy.maxHp).toBe(normalEnemyHp * 2 * 3);
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.currentDefense).toBe(
      calculateStat(TD_CREATURE_DEFS.mouse_1.baseCreature.defense, enemyLevel) *
        2.5
    );
    expect(enemy.currentSpecialDefense).toBe(
      calculateStat(
        TD_CREATURE_DEFS.mouse_1.baseCreature.specialDefense,
        enemyLevel
      ) * 3
    );
    expect(enemy.waveEnemyDefinitionId).toBe('armored_mouse');

    const captured = engine.captureEnemy(enemy.id);
    expect(captured).not.toBeNull();
    const capturedCreature = resolvePlayerCreature(captured!);
    expect(capturedCreature.maxHp).toBe(
      calculateMaxHp(COSMOID_TEMPLATES.mouse_1.baseStats.hp, enemyLevel)
    );
    expect(capturedCreature.maxHp).not.toBe(enemy.maxHp);
    expect(capturedCreature.level).toBe(enemyLevel);

    engine.destroy();
  });
});
