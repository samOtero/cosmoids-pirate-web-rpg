import {
  BattleConfig,
  BattleContext,
  BackgroundImageKey,
  DialogContext,
} from '@/types/baseGame';
import { SENTICLE, BUG_STAGE_1 } from './creatures';

export const BATTLES: Record<BattleContext, BattleConfig> = {
  [BattleContext.FIRST_BATTLE]: {
    enemy: SENTICLE,
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
        type: 'ADVANCE_NODE',
        autoProceed: true,
        payload: {
          islandId: 0,
          nodeIndex: 1,
        },
      },
      {
        type: 'GO_TO_ISLAND_MAP',
        autoProceed: true,
        payload: {
          islandId: 0,
        },
      },
      {
        type: 'SHOW_ISLAND_MAP_DIALOG',
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
    enemy: BUG_STAGE_1,
    backgroundImageKey: BackgroundImageKey.FOREST,
    turnEvents: {},
    winEvents: [
      {
        type: 'ADVANCE_NODE',
        autoProceed: true,
        payload: {
          islandId: 0,
          nodeIndex: 2,
        },
      },
      {
        type: 'GO_TO_ISLAND_MAP',
        payload: {
          islandId: 0,
        },
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_ISLAND_MAP',
        payload: {
          islandId: 0,
        },
      },
    ],
  },
};
