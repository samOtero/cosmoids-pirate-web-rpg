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
        type: 'GO_TO_LEVEL_SELECT',
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
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
  },
};

/** Ordered list of levels for the Level Select screen. */
export interface LevelInfo {
  context: TDLevelContext;
  name: string;
  description: string;
  /** Story progression required to unlock this level. Undefined = always unlocked. */
  requiredProgression?: number;
}

export const LEVEL_ORDER: LevelInfo[] = [
  {
    context: TDLevelContext.FIRST_LEVEL,
    name: 'Landing Point',
    description: 'Where your journey begins.',
  },
  {
    context: TDLevelContext.FOREST_LEVEL_2,
    name: 'Coconut Grove',
    description: 'A grove with fresh coconuts.',
    requiredProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
  },
  // Placeholder locked levels
  {
    context: 'LOCKED_3' as TDLevelContext,
    name: 'Coral Caves',
    description: 'Deep sea tunnels hide treasure.',
    requiredProgression: 999,
  },
  {
    context: 'LOCKED_4' as TDLevelContext,
    name: 'Stormy Atoll',
    description: 'Constant rain strengthens water types.',
    requiredProgression: 999,
  },
  {
    context: 'LOCKED_5' as TDLevelContext,
    name: 'Volcanic Crag',
    description: 'Intense heat and tough enemies.',
    requiredProgression: 999,
  },
  {
    context: 'LOCKED_6' as TDLevelContext,
    name: 'Abyssal Point',
    description: 'The edge of the known world.',
    requiredProgression: 999,
  },
];
