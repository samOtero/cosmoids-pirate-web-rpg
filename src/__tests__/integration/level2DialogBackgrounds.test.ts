import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LEVEL_2_SHIPWRECK_INTRO } from '@/constants/dialogs';
import { BACKGROUND_IMAGES } from '@/constants/game';
import { BackgroundImageKey } from '@/types/baseGame';

describe('Level 2 dialog background continuity', () => {
  it('uses the wave-impact scene for the shipwreck narration', () => {
    expect(LEVEL_2_SHIPWRECK_INTRO.sequence[0].backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_2_WAVE_IMPACT
    );
  });

  it('uses the repaired boat and supplies for the rest of the dialog', () => {
    const repairedBoatLineIndex = LEVEL_2_SHIPWRECK_INTRO.sequence.findIndex(
      ({ text }) => text === "We did it! It's not pretty, but it should float."
    );

    expect(repairedBoatLineIndex).toBeGreaterThan(-1);
    for (const line of LEVEL_2_SHIPWRECK_INTRO.sequence.slice(
      repairedBoatLineIndex
    )) {
      expect(line.backgroundImageKey).toBe(
        BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES
      );
    }
  });

  it('ships both registered background images', () => {
    for (const key of [
      BackgroundImageKey.LEVEL_2_WAVE_IMPACT,
      BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
    ]) {
      const url = BACKGROUND_IMAGES[key];

      expect(existsSync(join(process.cwd(), 'public', url))).toBe(true);
    }
  });
});
