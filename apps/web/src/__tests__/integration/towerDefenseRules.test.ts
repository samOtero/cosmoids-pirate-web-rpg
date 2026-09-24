import { describe, expect, it } from 'vitest';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { LEVEL_7_INTRO } from '@/constants/dialogs/level7Intro';
import { LEVEL_7_WIN } from '@/constants/dialogs/level7Win';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { LEVEL_4 } from '@/constants/tdLevels/level4';
import { LEVEL_7 } from '@/constants/tdLevels/level7';
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
  BackgroundImageKey,
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

  it('opens Level 4 zoomed out with a bottom-right-to-top-left camera tour', () => {
    expect(LEVEL_4.initialView).toEqual({
      offsetX: 0,
      offsetY: 0,
      zoom: 0.62,
    });
    expect(LEVEL_4.openingPan).toEqual({
      fromOffsetX: 100,
      fromOffsetY: 100,
      durationMs: 2000,
    });
  });

  it('keeps separate path backgrounds for Levels 2 and 3', () => {
    expect(FOREST_LEVEL.backgroundUrl).toBe(
      '/battles/bg/bg_coastal_island_battle_path_v2.webp'
    );
    expect(VANE_LEVEL.backgroundUrl).toBe(
      '/battles/bg/bg_coastal_island_battle_path_level_3.webp'
    );
  });

  it('sets up Level 7 as a single-screen, cannot-lose wildlife visit', () => {
    const definitions = new Map(
      LEVEL_7.waveEnemyDefinitions.map((definition) => [
        definition.id,
        definition,
      ])
    );
    const landGroup = LEVEL_7.waves[0].groups[0];
    const waterGroup = LEVEL_7.waves[0].groups[1];
    const engine = new TowerDefenseEngine(LEVEL_7);

    expect(LEVEL_7).toMatchObject({
      backgroundUrl: '/battles/bg/bg_level_7_red_sandstone_shore.webp',
      backgroundScale: 1,
      cannotLose: true,
      closeCompletesLevel: true,
    });
    expect(LEVEL_7.paths).toHaveLength(2);
    expect(LEVEL_7.paths[0].every((point) => point.y <= 43)).toBe(true);
    expect(LEVEL_7.paths[1].every((point) => point.y >= 68)).toBe(true);
    expect(LEVEL_7.environmentUnits).toEqual([
      {
        tdConfigId: 'tigrevel_shore_leave',
        position: { x: 50, y: 22 },
      },
      {
        tdConfigId: 'kip_shore_leave',
        position: { x: 80, y: 17 },
      },
      {
        tdConfigId: 'maribel_shore_leave',
        position: { x: 10, y: 42 },
      },
      {
        tdConfigId: 'caleb_shore_leave',
        position: { x: 91, y: 55 },
      },
    ]);
    expect(CREATURE_TD_CONFIGS.tigrevel_shore_leave.default.url).toBe(
      '/battles/cosmoids/tigrevel_sleeping.webp'
    );
    expect(CREATURE_TD_CONFIGS.kip_shore_leave.default.url).toBe(
      '/battles/characters/kip_journaling.webp'
    );
    expect(CREATURE_TD_CONFIGS.maribel_shore_leave.default.url).toBe(
      '/battles/characters/maribel_navigating.webp'
    );
    expect(CREATURE_TD_CONFIGS.caleb_shore_leave.default.url).toBe(
      '/battles/characters/caleb_skipping_stones.webp'
    );
    expect(definitions.get(landGroup.enemyDefinitionId)?.creatureId).toBe(
      'yokodillo'
    );
    expect(landGroup).toMatchObject({ pathIndex: 0 });
    expect(landGroup).not.toHaveProperty('turnAroundAtEnd');
    expect(definitions.get(waterGroup.enemyDefinitionId)?.creatureId).toBe(
      'dormatee'
    );
    expect(waterGroup).toMatchObject({ pathIndex: 1 });
    expect(waterGroup).not.toHaveProperty('turnAroundAtEnd');
    expect(engine.cannotLose).toBe(true);
    engine.destroy();
  });

  it('moves the Level 7 intro from the cramped boat to the new landfall art', () => {
    expect(LEVEL_7_INTRO.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_6_CRAMPED_CREW_DEPARTURE
    );
    expect(
      LEVEL_7_INTRO.sequence.slice(0, 3).every(
        (line) => line.backgroundImageKey === undefined
      )
    ).toBe(true);
    expect(
      LEVEL_7_INTRO.sequence.slice(3).map((line) => line.backgroundImageKey)
    ).toEqual([
      BackgroundImageKey.LEVEL_7_LANDFALL,
      BackgroundImageKey.LEVEL_7_LANDFALL,
    ]);
  });

  it('uses the late-afternoon departure art throughout the Level 7 ending', () => {
    expect(LEVEL_7_WIN.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_7_DEPARTURE
    );
    expect(
      LEVEL_7_WIN.sequence.every(
        (line) => line.backgroundImageKey === undefined
      )
    ).toBe(true);
  });

  it('unlocks and completes Level 7 through its single peaceful ending', () => {
    expect(LEVEL_ORDER[6]).toMatchObject({
      context: TDLevelContext.LEVEL_7,
      name: 'Shore Leave',
      requiredProgression: StoryProgression.DEFEAT_LEVEL_6,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_6].winEvents[0]).toEqual({
      type: 'SET_STORY_PROGRESSION',
      payload: { progression: StoryProgression.DEFEAT_LEVEL_6 },
      autoProceed: true,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_7]).toMatchObject({
      levelData: LEVEL_7,
      journalCompletion: {
        progression: StoryProgression.COMPLETE_LEVEL_7,
        seenSpeciesIds: ['dormatee', 'yokodillo'],
      },
      introEvents: [
        {
          type: 'SHOW_DIALOG',
          payload: { context: DialogContext.LEVEL_7_INTRO },
        },
      ],
      winEvents: [
        {
          type: 'SET_STORY_PROGRESSION',
          payload: { progression: StoryProgression.COMPLETE_LEVEL_7 },
          autoProceed: true,
        },
        {
          type: 'SHOW_DIALOG',
          payload: { context: DialogContext.LEVEL_7_WIN },
        },
        { type: 'GO_TO_LEVEL_SELECT' },
      ],
      loseEvents: [{ type: 'GO_TO_LEVEL_SELECT' }],
    });
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

  it.each(LEVEL_4.waves)(
    'blocks Razound capture but allows Razcall capture in Ironbell wave $id',
    (wave) => {
      const engine = new TowerDefenseEngine({
        ...LEVEL_4,
        startingTowers: [],
        waves: [
          {
            ...wave,
            groups: wave.groups.map((group) => ({
              ...group,
              count: 1,
              spawnIntervalMs: 1,
              delayBeforeGroupMs: 0,
              concurrentWithPrevious: true,
            })),
          },
        ],
      });

      engine.tick(1, 1);

      expect(engine.enemies).toHaveLength(wave.groups.length);
      for (const enemy of [...engine.enemies]) {
        if (enemy.definitionId === 'resonarion') {
          expect(engine.captureEnemy(enemy.id)).toBeNull();
          expect(engine.enemies).toContain(enemy);
        } else {
          expect(engine.captureEnemy(enemy.id)).toMatchObject({
            speciesId: 'sonarion',
          });
        }
      }

      engine.destroy();
    }
  );

  it('sets up Level 4 with its intro and staged market objective', () => {
    expect(LEVEL_4.paths).toHaveLength(6);
    expect(LEVEL_4.backgroundUrl).toBe('/battles/bg/bg_market_level_4.webp');
    expect(LEVEL_4.backgroundScale).toBe(3);
    expect(LEVEL_4.resonantEvolution).toBeUndefined();
    expect(LEVEL_4.captureUnits).toEqual([
      expect.objectContaining({
        tdConfigId: 'maribel_capture',
        carrierSpeedMultiplier: 0.9,
        position: { x: 26.8, y: 50 },
        returnHome: { pathIndex: 0, speed: 2, delayMs: 500 },
        waveRelocations: [
          expect.objectContaining({
            afterWaveIndex: 0,
            path: [
              { x: 26.8, y: 50 },
              { x: 47, y: 50 },
            ],
            speed: 7,
          }),
          expect.objectContaining({
            afterWaveIndex: 1,
            path: [
              { x: 47, y: 50 },
              { x: 70.6, y: 50 },
            ],
            speed: 7,
          }),
        ],
      }),
    ]);
    expect(CREATURE_TD_CONFIGS.maribel_capture).toMatchObject({
      default: { url: '/battles/characters/maribel_idle_1.webp' },
      idle: { url: '/battles/characters/maribel_idle_1.webp' },
      carried: { url: '/battles/characters/maribel_carried_1.webp' },
      left: { url: '/battles/characters/maribel_left_1.webp' },
      right: {
        url: '/battles/characters/maribel_left_1.webp',
        flipX: true,
      },
      up: { url: '/battles/characters/maribel_up_1.webp' },
      down: { url: '/battles/characters/maribel_down_1.webp' },
    });
    expect(
      LEVEL_4.waves.every((wave) =>
        wave.groups.every((group) => group.turnAroundAtEnd)
      )
    ).toBe(true);
    const level3BettleHpMultiplier = VANE_LEVEL.waveEnemyDefinitions?.find(
      (definition) => definition.id === 'vane_bettle_guard'
    )?.hpMultiplier;
    const level4RazoundHpMultiplier = LEVEL_4.waveEnemyDefinitions?.find(
      (definition) => definition.id === 'ironbell_resonarion'
    )?.hpMultiplier;
    expect(level4RazoundHpMultiplier).toBeLessThan(
      level3BettleHpMultiplier ?? Infinity
    );
    expect(
      LEVEL_4.waves.flatMap((wave) =>
        wave.groups.map((group) => group.enemyDefinitionId)
      )
    ).toEqual(
      expect.arrayContaining(['ironbell_sonarion', 'ironbell_resonarion'])
    );
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
      journalCompletion: {
        progression: StoryProgression.DEFEAT_LEVEL_4,
        seenSpeciesIds: ['sonarion', 'resonarion'],
      },
      winEvents: [
        {
          type: 'SET_STORY_PROGRESSION',
          payload: { progression: StoryProgression.DEFEAT_LEVEL_4 },
          autoProceed: true,
        },
        {
          type: 'SHOW_DIALOG',
          payload: { context: DialogContext.LEVEL_4_WIN },
        },
        { type: 'GO_TO_LEVEL_SELECT' },
      ],
      loseEvents: [
        {
          type: 'SHOW_DIALOG',
          payload: { context: DialogContext.LEVEL_4_LOSE },
        },
        { type: 'GO_TO_LEVEL_SELECT' },
      ],
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_4].introEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_4_INTRO },
      },
    ]);
    expect(
      TD_LEVELS[TDLevelContext.LEVEL_4].winEvents.some(
        (event) => event.type === 'SHOW_DIALOG'
      )
    ).toBe(true);
    expect(
      TD_LEVELS[TDLevelContext.LEVEL_4].loseEvents.some(
        (event) => event.type === 'SHOW_DIALOG'
      )
    ).toBe(true);
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
