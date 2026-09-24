import { TDLevelContext } from '@/types/baseGame';

export interface TDLevelSaveTarget {
  fileName: string;
  exportName: string;
}

/**
 * Source locations for levels that already exist in the game registry.
 *
 * Registry keys are gameplay contexts and do not necessarily match the
 * exported constant or its file name (for example, FOREST_LEVEL_2).
 */
export const TD_LEVEL_SAVE_TARGETS: Record<TDLevelContext, TDLevelSaveTarget> =
  {
    [TDLevelContext.FIRST_LEVEL]: {
      fileName: 'firstLevel',
      exportName: 'FIRST_LEVEL',
    },
    [TDLevelContext.FOREST_LEVEL_2]: {
      fileName: 'forestLevel',
      exportName: 'FOREST_LEVEL',
    },
    [TDLevelContext.VANE_LEVEL_3]: {
      fileName: 'vaneLevel',
      exportName: 'VANE_LEVEL',
    },
    [TDLevelContext.LEVEL_4]: {
      fileName: 'level4',
      exportName: 'LEVEL_4',
    },
    [TDLevelContext.LEVEL_5]: {
      fileName: 'level5',
      exportName: 'LEVEL_5',
    },
    [TDLevelContext.LEVEL_6]: {
      fileName: 'level6',
      exportName: 'LEVEL_6',
    },
    [TDLevelContext.LEVEL_7]: {
      fileName: 'level7',
      exportName: 'LEVEL_7',
    },
    [TDLevelContext.CHALLENGE_FIRST_LEVEL]: {
      fileName: 'challengeFirstLevel',
      exportName: 'CHALLENGE_FIRST_LEVEL',
    },
    [TDLevelContext.CHALLENGE_FIRST_LEVEL_NO_CAPTURE]: {
      fileName: 'challengeFirstLevel',
      exportName: 'CHALLENGE_FIRST_LEVEL_NO_CAPTURE',
    },
  };

export function getTDLevelSaveTarget(
  levelContext: string
): TDLevelSaveTarget | undefined {
  return (TD_LEVEL_SAVE_TARGETS as Record<string, TDLevelSaveTarget>)[
    levelContext
  ];
}
