import { describe, expect, it } from 'vitest';

import { LEVEL_5_INTRO } from '@/constants/dialogs/level5Intro';
import { BACKGROUND_IMAGES } from '@/constants/game';
import { LEVEL_5 } from '@/constants/tdLevels/level5';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import {
  BackgroundImageKey,
  DialogContext,
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';

describe('Level 5 intro and placeholder level', () => {
  it('tells Mari’s Tigrevel story in ten panels', () => {
    expect(LEVEL_5_INTRO.sequence).toHaveLength(10);
    expect(LEVEL_5_INTRO.sequence.map((line) => line.text).join(' ')).toMatch(
      /Razhounds/i
    );
    expect(LEVEL_5_INTRO.sequence.map((line) => line.text).join(' ')).toMatch(
      /commander called it dangerous/i
    );
    expect(LEVEL_5_INTRO.sequence.at(-1)?.text).toMatch(
      /step away from that prisoner/i
    );
  });

  it('uses dedicated memory backgrounds before returning to the cell', () => {
    expect(
      LEVEL_5_INTRO.sequence.slice(2, 6).map((line) => line.backgroundImageKey)
    ).toEqual([
      BackgroundImageKey.LEVEL_5_MEMORY_BEACH,
      BackgroundImageKey.LEVEL_5_MEMORY_RAZHOUND_ATTACK,
      BackgroundImageKey.LEVEL_5_MEMORY_TIGREVEL_RESCUE,
      BackgroundImageKey.LEVEL_5_MEMORY_NAVY_CAPTURE,
    ]);
    expect(
      LEVEL_5_INTRO.sequence
        .slice(6)
        .every(
          (line) =>
            line.backgroundImageKey === BackgroundImageKey.LEVEL_5_TIGREVEL_CELL
        )
    ).toBe(true);
  });

  it('maps every new scene to its shipped background asset', () => {
    expect(BACKGROUND_IMAGES).toMatchObject({
      [BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT]:
        '/bg_level_5_ironbell_undercroft.png',
      [BackgroundImageKey.LEVEL_5_MEMORY_BEACH]: '/bg_level_5_memory_beach.png',
      [BackgroundImageKey.LEVEL_5_MEMORY_RAZHOUND_ATTACK]:
        '/bg_level_5_memory_razhound_attack.png',
      [BackgroundImageKey.LEVEL_5_MEMORY_TIGREVEL_RESCUE]:
        '/bg_level_5_memory_tigrevel_rescue.png',
      [BackgroundImageKey.LEVEL_5_MEMORY_NAVY_CAPTURE]:
        '/bg_level_5_memory_navy_capture.png',
      [BackgroundImageKey.LEVEL_5_TIGREVEL_CELL]:
        '/bg_level_4_ironbell_cell.png',
    });
  });

  it('registers the playable placeholder after Level 4', () => {
    expect(LEVEL_ORDER[4]).toMatchObject({
      context: TDLevelContext.LEVEL_5,
      requiredProgression: StoryProgression.DEFEAT_LEVEL_4,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_5]).toMatchObject({
      levelData: LEVEL_5,
      introEvents: [
        {
          type: 'SHOW_DIALOG',
          payload: { context: DialogContext.LEVEL_5_INTRO },
        },
      ],
      journalCompletion: {
        progression: StoryProgression.DEFEAT_LEVEL_5,
        seenSpeciesIds: ['tigrevel'],
      },
    });
  });
});
