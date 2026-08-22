import { describe, expect, it } from 'vitest';

import { LEVEL_4_INTRO } from '@/constants/dialogs/level4Intro';
import { BackgroundImageKey } from '@/types/baseGame';

describe('Level 4 intro', () => {
  it('keeps the opening scene within the ordinary dialogue limit', () => {
    expect(LEVEL_4_INTRO.sequence).toHaveLength(7);
    expect(LEVEL_4_INTRO.sequence.every((line) => !line.text.includes('—'))).toBe(
      true
    );
  });

  it('moves from the pursuit to Ironbell Harbor and then the market', () => {
    expect(LEVEL_4_INTRO.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_4_VANE_CHASE
    );
    expect(LEVEL_4_INTRO.sequence[3].backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_4_IRONBELL_HARBOR
    );
    expect(
      LEVEL_4_INTRO.sequence.slice(4).every(
        (line) =>
          line.backgroundImageKey === BackgroundImageKey.LEVEL_4_IRONBELL_MARKET
      )
    ).toBe(true);
  });
});
