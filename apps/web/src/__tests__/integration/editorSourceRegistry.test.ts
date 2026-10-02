import path from 'node:path';
import { TD_LEVELS } from '@/constants/tdLevels';
import { getTDLevelSaveTarget } from '@/constants/tdLevelSaveTargets';
import * as dialogs from '@/constants/dialogs';
import { ANIMATIONS } from '@/constants/animations';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { loadEditorSource } from '@/utils/editorSourceService';
import { readEditorSnapshot } from '@/utils/editorSourceRead';

describe('editor source loading for registered content', () => {
  it('reads every level from its authored source', async () => {
    for (const [context, entry] of Object.entries(TD_LEVELS)) {
      expect(getTDLevelSaveTarget(context), context).toBeDefined();
      const snapshot = await loadEditorSource('level', context);
      expect(JSON.parse(JSON.stringify(snapshot.config)), context).toEqual(
        JSON.parse(JSON.stringify(entry.levelData))
      );
    }
  }, 10000);

  it('reads every dialogue without evaluating the source module', async () => {
    for (const [id, config] of Object.entries(dialogs)) {
      if (!config || typeof config !== 'object' || !('sequence' in config))
        continue;
      const snapshot = await loadEditorSource('dialog', id);
      expect(JSON.parse(JSON.stringify(snapshot.config)), id).toEqual(
        JSON.parse(JSON.stringify(config))
      );
    }
  }, 10000);

  it('reads the animations and every visual entry directly from source', async () => {
    const animations = await loadEditorSource('animations', 'ANIMATIONS');
    expect(animations.config).toEqual(ANIMATIONS);
    for (const [id, config] of Object.entries(CREATURE_TD_CONFIGS)) {
      const snapshot = await readEditorSnapshot(
        path.join(process.cwd(), 'src/constants/tdConfigs.ts'),
        'CREATURE_TD_CONFIGS',
        config,
        id
      );
      expect(JSON.parse(JSON.stringify(snapshot.config)), id).toEqual(
        JSON.parse(JSON.stringify(config))
      );
    }
  }, 10000);
});
