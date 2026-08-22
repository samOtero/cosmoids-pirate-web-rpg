import {
  TDLevelContext,
  TDLevelConfig,
  DialogContext,
  StoryProgression,
} from '@/types/baseGame';
import { FIRST_LEVEL } from './firstLevel';
import { FOREST_LEVEL } from './forestLevel';
import { LEVEL_4 } from './level4';
import { VANE_LEVEL } from './vaneLevel';
import {
  CHALLENGE_FIRST_LEVEL,
  CHALLENGE_FIRST_LEVEL_NO_CAPTURE,
} from './challengeFirstLevel';

export const TD_LEVELS: Record<TDLevelContext, TDLevelConfig> = {
  [TDLevelContext.FIRST_LEVEL]: {
    levelData: FIRST_LEVEL,
    journalCompletion: {
      progression: StoryProgression.DEFEAT_FIRST_BATTLE,
      seenSpeciesIds: [],
    },
    introEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.LEVEL_1_INTRO,
        },
      },
    ],
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
    journalCompletion: {
      progression: StoryProgression.DEFEAT_BUG_STAGE_1,
      seenSpeciesIds: ['mouse_1', 'harlequill', 'mopup'],
    },
    introEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.LEVEL_2_INTRO,
        },
      },
    ],
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_BUG_STAGE_1 },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_2_WIN },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_2_LOSE },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
  },
  [TDLevelContext.VANE_LEVEL_3]: {
    levelData: VANE_LEVEL,
    journalCompletion: {
      progression: StoryProgression.DEFEAT_BUG_STAGE_2,
      seenSpeciesIds: ['bug_stage_1', 'bettle'],
    },
    introEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.LEVEL_3_INTRO,
        },
      },
    ],
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_BUG_STAGE_2 },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_3_WIN },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_3_LOSE },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
  },
  [TDLevelContext.LEVEL_4]: {
    levelData: LEVEL_4,
    journalCompletion: {
      progression: StoryProgression.DEFEAT_LEVEL_4,
      seenSpeciesIds: ['sonarion', 'resonarion'],
    },
    introEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: {
          context: DialogContext.LEVEL_4_INTRO,
        },
      },
    ],
    winEvents: [
      {
        type: 'SET_STORY_PROGRESSION',
        payload: { progression: StoryProgression.DEFEAT_LEVEL_4 },
        autoProceed: true,
      },
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_4_WIN },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'SHOW_DIALOG',
        payload: { context: DialogContext.LEVEL_4_LOSE },
      },
      {
        type: 'GO_TO_LEVEL_SELECT',
      },
    ],
  },
  [TDLevelContext.CHALLENGE_FIRST_LEVEL]: {
    levelData: CHALLENGE_FIRST_LEVEL,
    winEvents: [
      {
        type: 'GO_TO_CHALLENGE_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_CHALLENGE_SELECT',
      },
    ],
  },
  [TDLevelContext.CHALLENGE_FIRST_LEVEL_NO_CAPTURE]: {
    levelData: CHALLENGE_FIRST_LEVEL_NO_CAPTURE,
    winEvents: [
      {
        type: 'GO_TO_CHALLENGE_SELECT',
      },
    ],
    loseEvents: [
      {
        type: 'GO_TO_CHALLENGE_SELECT',
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
    name: 'Seabreeze Docks',
    description: 'A would-be captain faces his first real test.',
  },
  {
    context: TDLevelContext.FOREST_LEVEL_2,
    name: 'Shipwreck Shore',
    description: 'Protect the supplies needed to escape the island.',
    requiredProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
  },
  {
    context: TDLevelContext.VANE_LEVEL_3,
    name: "Kip's Dream",
    description: "Defend the repaired boat from Captain Vane's Bug Cosmoids.",
    requiredProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
  },
  {
    context: TDLevelContext.LEVEL_4,
    name: 'Level 4',
    description: 'Continue the adventure beyond Captain Vane.',
    requiredProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
  },
  {
    context: 'LOCKED_5' as TDLevelContext,
    name: 'Coming soon',
    description: 'More story adventures are on the way.',
    requiredProgression: StoryProgression.DEFEAT_LEVEL_4,
  },
];

/** Ordered list of challenge levels for the Challenge Select screen. */
export const CHALLENGE_LEVEL_ORDER: LevelInfo[] = [
  {
    context: TDLevelContext.CHALLENGE_FIRST_LEVEL,
    name: 'Seabreeze Docks - One Life Gauntlet',
    description: 'Survive Level 1 with a single life and a lone Fueguana.',
  },
  {
    context: TDLevelContext.CHALLENGE_FIRST_LEVEL_NO_CAPTURE,
    name: 'Seabreeze Docks - No Capture Run',
    description: 'Level 1 with one Fueguana — no capturing allowed.',
  },
  // Placeholder locked levels
  {
    context: 'LOCKED_3' as TDLevelContext,
    name: 'More levels coming soon',
    description: 'TBD.',
    requiredProgression: 999,
  },
];
