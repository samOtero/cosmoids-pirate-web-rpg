import {
  BattleConfig,
  BattleContext,
  BackgroundImageKey,
  DialogContext,
} from '@/types/baseGame';
import { SENTICLE } from './creatures';

export const BATTLES: Record<BattleContext, BattleConfig> = {
  [BattleContext.FIRST_BATTLE]: {
    enemy: SENTICLE,
    backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
    afterStartEvents: [
      {
        type: 'SHOW_BATTLE_DIALOG',
        payload: {
          context: DialogContext.LEVEL_1_INSTRUCTION_1,
        },
      },
    ],
    turnEvents: {
      1: {
        beforeEnemyAttack: [
          {
            type: 'SHOW_BATTLE_DIALOG',
            payload: {
              context: DialogContext.LEVEL_1_INSTRUCTION_1,
            },
          },
        ],
        afterEnemyAttack: [
          {
            type: 'SHOW_BATTLE_DIALOG',
            payload: {
              context: DialogContext.LEVEL_1_INSTRUCTION_1,
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
};
