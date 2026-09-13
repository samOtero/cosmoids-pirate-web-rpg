import { describe, expect, it } from 'vitest';

import {
  LEVEL_6_INTRO,
  LEVEL_6_LOSE,
  LEVEL_6_WIN,
} from '@/constants/dialogs';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { LEVEL_6 } from '@/constants/tdLevels/level6';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import {
  DialogContext,
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';

describe('Level 6 playable placeholder', () => {
  it('unlocks after Level 5 and opens with the officer confrontation', () => {
    expect(LEVEL_ORDER[5]).toMatchObject({
      context: TDLevelContext.LEVEL_6,
      requiredProgression: StoryProgression.DEFEAT_LEVEL_5,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_6].introEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_6_INTRO },
      },
    ]);
    expect(LEVEL_6_INTRO.sequence).toHaveLength(10);
    expect(LEVEL_6_INTRO.sequence[0]).toMatchObject({
      text: 'Commander Strake... He’s the one who ordered Tigrevel dragged beneath Ironbell.',
      portraits: [
        {
          key: 'Maribel_Worried',
          displayName: 'Mari',
          flipped: true,
        },
      ],
    });
    expect(LEVEL_6_INTRO.sequence[1].text).toContain(
      'You’ll be dragged back by force.'
    );
    expect(LEVEL_6_INTRO.sequence[1].portraits[0].displayName).toBe(
      'Commander Strake'
    );
    expect(LEVEL_6_INTRO.sequence[2].backgroundImageKey).toBe(
      'Level_6_Net_Throw'
    );
    expect(LEVEL_6_INTRO.sequence[5]).toMatchObject({
      text: 'BWOOOONG!',
      portraits: [{ key: 'Voltusk_Warning', displayName: 'Voltusk' }],
    });
    expect(LEVEL_6_INTRO.backgroundImageKey).toBe('Level_6_Tigrevel_Netted');
  });

  it('uses the netted Tigrevel visual as the single recapture objective', () => {
    expect(LEVEL_6.captureUnits).toEqual([
      expect.objectContaining({ tdConfigId: 'tigrevel_netted' }),
    ]);
    expect(LEVEL_6.lives).toBe(1);

    const nettedVisuals = CREATURE_TD_CONFIGS.tigrevel_netted;
    expect(nettedVisuals).toBeDefined();
    for (const state of [
      'default',
      'idle',
      'carried',
      'left',
      'right',
      'up',
      'down',
    ] as const) {
      expect(nettedVisuals[state]?.url).toBe(
        '/battles/cosmoids/tigrevel_netted.png'
      );
    }

    const engine = new TowerDefenseEngine(LEVEL_6);
    expect(engine.hasCaptureUnitsGoal).toBe(true);
    expect(engine.lives).toBe(1);
    engine.destroy();
  });

  it('gives Poguin two lanes and Tigrevel a separate center track', () => {
    expect(LEVEL_6.paths).toHaveLength(3);

    const [upperLane, tigrevelTrack, lowerLane] = LEVEL_6.paths;
    expect(tigrevelTrack.every((point) => point.y === 55)).toBe(true);
    expect(LEVEL_6.captureUnits?.[0]).toMatchObject({
      position: tigrevelTrack.at(-1),
      haulPathIndex: 1,
      groupHauling: {
        eligibleCreatureId: 'poguin',
        joinRadius: 12,
        baseSpeedMultiplier: 0.12,
        speedMultiplierPerAdditionalHauler: 0.16,
        maxSpeedMultiplier: 0.92,
      },
    });
    expect(upperLane.every((point) => point.y === 52)).toBe(true);
    expect(lowerLane.every((point) => point.y === 58)).toBe(true);
    expect(lowerLane[0].y - upperLane[0].y).toBe(6);
    expect(
      LEVEL_6.waves.flatMap((wave) =>
        wave.groups
          .filter((group) => group.enemyDefinitionId === 'level_6_poguin')
          .map((group) => group.pathIndex)
      )
    ).toEqual([0, 2, 2]);
    expect(
      LEVEL_6.waves.flatMap((wave) =>
        wave.groups
          .filter((group) => group.enemyDefinitionId === 'level_6_poguin')
          .map((group) => group.laneHop)
      )
    ).toEqual([
      expect.objectContaining({
        targetPathIndex: 2,
        triggerProgress: 0.34,
      }),
      expect.objectContaining({
        targetPathIndex: 0,
        triggerProgress: 0.66,
      }),
      expect.objectContaining({
        targetPathIndex: 0,
        triggerProgress: 0.5,
      }),
    ]);
    expect(
      LEVEL_6.waveEnemyDefinitions.find(
        (definition) => definition.id === 'level_6_voltusk'
      )
    ).toMatchObject({
      stationaryPosition: { x: 85, y: 14 },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
    });
    expect(LEVEL_6.safePlacementSpotIndices).toEqual([3, 5]);
    expect(LEVEL_6.towerRecovery).toMatchObject({
      placementSpotIndices: [3, 5],
      healerPosition: { x: 18, y: 14 },
      healerIdleFacingDirection: 'down',
      healFraction: 0.35,
      feedingIntervalMs: 8000,
      tutorial: {
        triggerHealthFraction: 0.75,
        speakerName: 'Mari',
      },
    });
    expect(
      LEVEL_6.environmentUnits?.find(
        (unit) => unit.tdConfigId === 'maribel_capture'
      )?.facingDirection
    ).toBe('down');

    const engine = new TowerDefenseEngine(LEVEL_6);
    const combatSpots = LEVEL_6.placementSpots.slice(0, 3);
    const safeSpots = LEVEL_6.safePlacementSpotIndices!.map(
      (index) => LEVEL_6.placementSpots[index]
    );
    expect(combatSpots.every((spot) => spot.x > 70 && spot.y < 30)).toBe(true);
    expect(safeSpots).toHaveLength(2);
    expect(safeSpots.every((spot) => spot.x < 30 && spot.y < 30)).toBe(true);
    for (const spot of combatSpots) {
      expect(
        Math.min(
          ...upperLane.map((point) => engine.getAttackDistance(spot, point))
        )
      ).toBeGreaterThan(40);
    }
    for (const spot of safeSpots) {
      expect(
        Math.min(
          ...upperLane.map((point) => engine.getAttackDistance(spot, point))
        )
      ).toBeGreaterThan(40);
    }
    engine.destroy();

    expect(LEVEL_6.backgroundUrl).toBe(
      '/battles/bg/bg_level_6_three_lane_compact_v1.png'
    );
    expect(LEVEL_6.backgroundScale).toBe(2);
    expect(LEVEL_6.initialView).toEqual({
      offsetX: 50,
      offsetY: 50,
      zoom: 1 / 2,
    });
  });

  it('ends with Tigrevel and Mari voluntarily joining the crew', () => {
    expect(TD_LEVELS[TDLevelContext.LEVEL_6].winEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_6_WIN },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ]);
    expect(LEVEL_6_WIN.sequence).toHaveLength(11);
    expect(LEVEL_6_WIN.sequence[0].text).toContain('My Voltusk—defeated?');
    expect(LEVEL_6_WIN.sequence[0].portraits).toEqual([
      expect.objectContaining({
        key: 'Navy_Commander_Shocked_Defeat',
        displayName: 'Commander Strake',
        flipped: true,
      }),
    ]);
    expect(LEVEL_6_WIN.sequence[4].text).toContain(
      'walks straight past the doubloon'
    );
    expect(LEVEL_6_WIN.sequence[8].text).toContain('I think I have more.');
    expect(LEVEL_6_WIN.sequence[10]).toMatchObject({
      text: expect.stringContaining('We need a bigger boat.'),
      portraits: [
        expect.objectContaining({
          key: 'Maribel_Determined',
          displayName: 'Mari',
        }),
      ],
      backgroundImageKey: 'Level_6_Cramped_Crew_Departure',
    });
    expect(
      LEVEL_6_WIN.sequence.slice(2, 9).map((line) => line.backgroundImageKey)
    ).toEqual(Array(7).fill('Level_6_Tigrevel_Claims_Boat'));
    expect(
      LEVEL_6_WIN.sequence.slice(9).map((line) => line.backgroundImageKey)
    ).toEqual(Array(2).fill('Level_6_Cramped_Crew_Departure'));
  });

  it('lets Commander Strake deliver the defeat line', () => {
    expect(TD_LEVELS[TDLevelContext.LEVEL_6].loseEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_6_LOSE },
      },
      { type: 'GO_TO_LEVEL_SELECT' },
    ]);
    expect(LEVEL_6_LOSE).toMatchObject({
      sequence: [
        {
          text: 'Order is restored.',
          portraits: [
            {
              key: 'Navy_Commander_Neutral',
              displayName: 'Commander Strake',
              flipped: true,
            },
          ],
        },
      ],
      backgroundImageKey: 'Level_6_Tigrevel_Netted',
    });
  });

  it('fields uncapturable Poguin support and Voltusk as the placeholder boss', () => {
    expect(
      LEVEL_6.waveEnemyDefinitions.map((definition) => definition.creatureId)
    ).toEqual(['poguin', 'voltusk']);
    expect(
      LEVEL_6.waves.flatMap((wave) =>
        wave.groups.map((group) => group.uncapturable)
      )
    ).toEqual([true, true, true, true]);
    expect(
      LEVEL_6.waves[1].groups.some(
        (group) => group.enemyDefinitionId === 'level_6_voltusk'
      )
    ).toBe(true);
  });
});
