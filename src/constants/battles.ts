import {
  BattleConfig,
  BattleContext,
  BackgroundImageKey,
  DialogContext,
} from '@/types/baseGame';
import { createWildCreature } from '@/utils/resolvePlayerCreature';

export const BATTLES: Record<BattleContext, BattleConfig> = {
  [BattleContext.FIRST_BATTLE]: {
    enemy: createWildCreature('senticle', 15),
    backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
    turnEvents: {
      1: {
        start: [
          {
            type: 'SHOW_BATTLE_DIALOG',
            payload: {
              context: DialogContext.LEVEL_1_INSTRUCTION_1,
            },
          },
        ],
        beforeEnemyAttack: [
          {
            type: 'SHOW_BATTLE_DIALOG',
            payload: {
              context: DialogContext.LEVEL_1_INSTRUCTION_2,
            },
          },
        ],
        afterEnemyAttack: [
          {
            type: 'SHOW_BATTLE_DIALOG',
            payload: {
              context: DialogContext.LEVEL_1_INSTRUCTION_3,
            },
          },
        ],
      },
    },
    winEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.LEVEL_1_WIN,
        },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
        autoProceed: true,
        payload: {
          islandId: 0,
        },
      },
      {
        type: 'SHOW_LEVEL_SELECT_DIALOG',
        payload: {
          context: DialogContext.LEVEL_2_ISLAND_MAP_INTRO,
        },
      },
    ],
    loseEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.STARTER_BATTLE_LOSE,
        },
      },
    ],
  },
  [BattleContext.FOREST_BUG_BATTLE]: {
    enemy: createWildCreature('bug_stage_1', 3),
    backgroundImageKey: BackgroundImageKey.FOREST,
    turnEvents: {},
    drops: [
      {
        itemId: 'BERRY',
        chance: 0.5,
        min: 1,
        max: 1,
      },
      {
        itemId: 'CATCH_DEVICE',
        chance: 1.0,
        min: 1,
        max: 1,
      },
    ],
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        autoProceed: true,
        payload: {
          progression: 3, // StoryProgression.DEFEAT_BUG_STAGE_1
        },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
  },
  [BattleContext.FOREST_BUG_STAGE_2_BATTLE]: {
    enemy: createWildCreature('bug_stage_2', 8),
    backgroundImageKey: BackgroundImageKey.FOREST,
    turnEvents: {},
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        autoProceed: true,
        payload: {
          progression: 4, // StoryProgression.DEFEAT_BUG_STAGE_2
        },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
  },
  [BattleContext.FOREST_MOTH_BATTLE]: {
    enemy: createWildCreature('bug_stage_3', 8),
    backgroundImageKey: BackgroundImageKey.FOREST_2,
    turnEvents: {},
    winEvents: [
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_LEVEL_SELECT',
        payload: {
          islandId: 0,
        },
      },
    ],
  },
};
