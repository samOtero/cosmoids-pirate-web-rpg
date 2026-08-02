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
