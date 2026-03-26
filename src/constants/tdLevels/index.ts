import {
  TDLevelContext,
  TDLevelConfig,
  DialogContext,
  StoryProgression,
} from '@/types/baseGame';
import { FIRST_LEVEL } from './firstLevel';
import { FOREST_LEVEL } from './forestLevel';

export const TD_LEVELS: Record<TDLevelContext, TDLevelConfig> = {
  [TDLevelContext.FIRST_LEVEL]: {
    levelData: FIRST_LEVEL,
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_FIRST_BATTLE },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_1_WIN },
      },
    ],
    loseEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.STARTER_BATTLE_LOSE },
      },
      {
        type: 'GO_TO_ISLAND_MAP',
      },
    ],
  },
  [TDLevelContext.FOREST_LEVEL_2]: {
    levelData: FOREST_LEVEL,
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_BUG_STAGE_1 },
        autoProceed: true,
      },
      {
        type: 'GO_TO_ISLAND_MAP',
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_ISLAND_MAP',
      },
    ],
  },
};
