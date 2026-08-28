import { describe, expect, it } from 'vitest';

import { LEVEL_5_INTRO } from '@/constants/dialogs/level5Intro';
import { LEVEL_5_LOSE } from '@/constants/dialogs/level5Lose';
import { LEVEL_5_WIN } from '@/constants/dialogs/level5Win';
import { BACKGROUND_IMAGES, SPEAKER_IMAGES } from '@/constants/game';
import { LEVEL_5 } from '@/constants/tdLevels/level5';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import {
  BackgroundImageKey,
  DialogContext,
  StoryProgression,
  SpeakerImageKey,
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
    expect(LEVEL_5_INTRO.sequence.at(-1)?.portraits).toEqual([
      {
        key: SpeakerImageKey.NAVY_GUARD_ALERT,
        displayName: 'Navy Guard',
      },
    ]);
    expect(SPEAKER_IMAGES[SpeakerImageKey.NAVY_GUARD_ALERT]).toBe(
      '/dialog/navy_guard_alert.png'
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
        '/bg_level_5_tigrevel_cell.png',
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

  it('ends the breakout with Tigrevel choosing to protect the children and the commander blocking the escape', () => {
    expect(LEVEL_5_WIN.sequence).toHaveLength(7);
    expect(LEVEL_5_WIN.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_5_TIGREVEL_FREED
    );
    expect(
      LEVEL_5_WIN.sequence.map(
        (line) => line.backgroundImageKey ?? LEVEL_5_WIN.backgroundImageKey
      )
    ).toEqual([
      BackgroundImageKey.LEVEL_5_TIGREVEL_FREED,
      BackgroundImageKey.LEVEL_5_TIGREVEL_FREED,
      BackgroundImageKey.LEVEL_5_TIGREVEL_FREED,
      BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
      BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
      BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
      BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    ]);
    expect(BACKGROUND_IMAGES).toMatchObject({
      [BackgroundImageKey.LEVEL_5_TIGREVEL_FREED]:
        '/bg_level_5_tigrevel_freed.png',
      [BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS]:
        '/bg_level_5_tigrevel_protects_kids.png',
    });

    const text = LEVEL_5_WIN.sequence.map((line) => line.text).join(' ');
    expect(text).toMatch(/get out before more Navy officers come/i);
    expect(text).toMatch(/staying to protect us/i);
    expect(text).not.toMatch(/Capture Coin/i);

    expect(LEVEL_5_WIN.sequence.at(-1)).toEqual({
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Navy Commander',
          flipped: true,
        },
      ],
      text: 'Touching. But no one leaves my fortress without my order.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    });
    expect(SPEAKER_IMAGES[SpeakerImageKey.TIGREVEL]).toBe(
      '/UI/Icons/tigrevel_icon.png'
    );
    expect(SPEAKER_IMAGES[SpeakerImageKey.NAVY_COMMANDER_NEUTRAL]).toBe(
      '/dialog/navy_commander_neutral.png'
    );
    expect(TD_LEVELS[TDLevelContext.LEVEL_5].winEvents).toEqual([
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_LEVEL_5 },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_5_WIN },
      },
      { type: 'GO_TO_LEVEL_SELECT' },
    ]);
  });

  it('uses Mari’s single apology over the intact cell after a loss', () => {
    expect(LEVEL_5_LOSE).toEqual({
      sequence: [
        {
          portraits: [
            {
              key: SpeakerImageKey.MARIBEL_WORRIED,
              displayName: 'Mari',
              flipped: true,
            },
          ],
          text: "I'm sorry, Tigrevel... we weren't strong enough to set you free.",
        },
      ],
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
    });
    expect(TD_LEVELS[TDLevelContext.LEVEL_5].loseEvents).toEqual([
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_5_LOSE },
      },
      { type: 'GO_TO_LEVEL_SELECT' },
    ]);
  });
});
