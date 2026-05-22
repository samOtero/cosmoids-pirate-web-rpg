import { DialogContext } from '@/types/baseGame';
import { GameEvent } from '@/types/baseGame';

/**
 * Events queued when a new player starts the game or opens a profile
 * without having picked a starter yet.
 * Sequence: Welcome Dialog → Level Select
 */
export const NEW_PLAYER_EVENTS: GameEvent[] = [
  {
    type: 'SHOW_DIALOG',
    payload: {
      context: DialogContext.NEW_PLAYER_WELCOME_DIALOG,
    },
  },
  {
    type: 'GO_TO_LEVEL_SELECT',
  },
];
