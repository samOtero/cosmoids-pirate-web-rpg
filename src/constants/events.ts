import { DialogContext } from '@/types/baseGame';
import { GameEvent, TDLevelContext } from '@/types/baseGame';

/**
 * Events queued when a new player starts the game or opens a profile
 * without having picked a starter yet.
 * Sequence: Welcome Dialog → Level 1 Intro → Tower Defense
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
    type: 'GO_TO_TOWER_DEFENSE',
    payload: {
      context: TDLevelContext.FIRST_LEVEL,
    },
  },
];

/**
 * Events queued when a player starts the game or opens a profile
 * after having picked a starter but haven't finished the first level.
 * Sequence: Level 1 Intro → Tower Defense
 */
export const FIRST_BATTLE_AFTER_GETTING_STARTER: GameEvent[] = [
  {
    type: 'SHOW_DIALOG',
    payload: {
      context: DialogContext.LEVEL_1_INTRO,
    },
  },
  {
    type: 'GO_TO_TOWER_DEFENSE',
    payload: {
      context: TDLevelContext.FIRST_LEVEL,
    },
  },
];
