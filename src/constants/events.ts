import { DialogContext, BattleContext } from '@/types/baseGame';
import { GameEvent } from '@/types/baseGame';

/**
 * Events queued when a new player starts the game or opens a profile
 * without having picked a starter yet.
 * Sequence: Welcome Dialog → Level 1 Intro → First Battle
 */
export const NEW_PLAYER_EVENTS: GameEvent[] = [
  {
    type: 'SHOW_DIALOG',
    payload: {
      context: DialogContext.NEW_PLAYER_WELCOME_DIALOG,
    },
  },
  {
    type: 'SHOW_DIALOG',
    payload: {
      context: DialogContext.LEVEL_1_INTRO,
      contextData: { dialogStartIndex: 1 },
    },
  },
  {
    type: 'START_BATTLE',
    payload: { context: BattleContext.FIRST_BATTLE },
  },
];
