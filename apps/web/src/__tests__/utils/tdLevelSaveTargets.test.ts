import {
  getTDLevelSaveTarget,
  TD_LEVEL_SAVE_TARGETS,
} from '@/constants/tdLevelSaveTargets';
import { TDLevelContext } from '@/types/baseGame';

describe('TD level editor save targets', () => {
  it('maps the second level context to its existing source export', () => {
    expect(getTDLevelSaveTarget(TDLevelContext.FOREST_LEVEL_2)).toEqual({
      fileName: 'forestLevel',
      exportName: 'FOREST_LEVEL',
    });
  });

  it('defines a save target for every registered level context', () => {
    expect(Object.keys(TD_LEVEL_SAVE_TARGETS).sort()).toEqual(
      Object.values(TDLevelContext).sort()
    );
  });

  it('rejects an unknown context instead of inventing a source file', () => {
    expect(getTDLevelSaveTarget('UNKNOWN_LEVEL')).toBeUndefined();
  });
});
