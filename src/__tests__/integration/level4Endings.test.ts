import { describe, expect, it } from 'vitest';

import { LEVEL_4_LOSE } from '@/constants/dialogs/level4Lose';
import { LEVEL_4_WIN } from '@/constants/dialogs/level4Win';
import { BackgroundImageKey, SpeakerImageKey } from '@/types/baseGame';

describe('Level 4 endings', () => {
  it("reveals Mari's mission after a win", () => {
    expect(LEVEL_4_WIN.sequence).toHaveLength(5);
    expect(LEVEL_4_WIN.sequence.map((line) => line.text).join(' ')).toMatch(
      /captured a tiger-shark Cosmoid and imprisoned it beneath Ironbell/i
    );
    expect(LEVEL_4_WIN.sequence.map((line) => line.text).join(' ')).toMatch(
      /bring it every meal/i
    );
    expect(LEVEL_4_WIN.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_4_IRONBELL_MARKET
    );
  });

  it('shows a sad Mari reporting the failed mission after a loss', () => {
    expect(LEVEL_4_LOSE.sequence).toEqual([
      {
        portraits: [
          {
            key: SpeakerImageKey.MARIBEL_WORRIED,
            displayName: 'Mari',
            flipped: true,
          },
        ],
        text: 'Mission failed...',
      },
    ]);
    expect(LEVEL_4_LOSE.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_4_IRONBELL_MARKET
    );
  });
});
