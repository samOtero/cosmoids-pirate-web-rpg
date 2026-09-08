import { describe, expect, it } from 'vitest';

import { LEVEL_6_INTRO, LEVEL_6_WIN } from '@/constants/dialogs';
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
    expect(LEVEL_6_INTRO.sequence[0].text).toContain(
      'You’ll be dragged back by force.'
    );
    expect(LEVEL_6_INTRO.sequence[1].backgroundImageKey).toBe(
      'Level_6_Net_Throw'
    );
    expect(LEVEL_6_INTRO.sequence[4]).toMatchObject({
      text: 'BWOOOONG!',
      portraits: [{ key: 'Voltusk_Warning', displayName: 'Voltusk' }],
    });
    expect(LEVEL_6_INTRO.backgroundImageKey).toBe(
      'Level_6_Tigrevel_Netted'
    );
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

  it('routes both lanes from one prison gate to the same Tigrevel position', () => {
    expect(LEVEL_6.paths).toHaveLength(2);

    const [upperLane, lowerLane] = LEVEL_6.paths;
    const upperStart = upperLane[0];
    const lowerStart = lowerLane[0];
    const upperEnd = upperLane.at(-1);
    const lowerEnd = lowerLane.at(-1);

    expect(upperStart).toEqual(lowerStart);
    expect(upperEnd).toEqual(lowerEnd);
    expect(LEVEL_6.captureUnits?.[0].position).toEqual(upperEnd);
    expect(Math.min(...upperLane.map((point) => point.y))).toBeLessThan(30);
    expect(Math.max(...lowerLane.map((point) => point.y))).toBeGreaterThan(60);
    expect(LEVEL_6.backgroundUrl).toBe(
      '/battles/bg/bg_level_6_two_lane_draft.png'
    );
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
    expect(LEVEL_6_WIN.sequence).toHaveLength(9);
    expect(LEVEL_6_WIN.sequence[0].text).toContain(
      'My Voltusk—defeated?'
    );
    expect(LEVEL_6_WIN.sequence[3].text).toContain(
      'walks straight past the doubloon'
    );
    expect(LEVEL_6_WIN.sequence[7].text).toContain(
      'I think I have more.'
    );
    expect(LEVEL_6_WIN.sequence[8]).toMatchObject({
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
      LEVEL_6_WIN.sequence.slice(2, 7).map((line) => line.backgroundImageKey)
    ).toEqual(Array(5).fill('Level_6_Tigrevel_Claims_Boat'));
    expect(
      LEVEL_6_WIN.sequence.slice(7).map((line) => line.backgroundImageKey)
    ).toEqual(Array(2).fill('Level_6_Cramped_Crew_Departure'));
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
