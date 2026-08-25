import { describe, expect, it } from 'vitest';

import { LEVEL_4_LOSE } from '@/constants/dialogs/level4Lose';
import { LEVEL_4_WIN } from '@/constants/dialogs/level4Win';
import { BackgroundImageKey, SpeakerImageKey } from '@/types/baseGame';

describe('Level 4 endings', () => {
  it("reveals Mari's mission and teases the imprisoned Tigrevel after a win", () => {
    expect(LEVEL_4_WIN.sequence).toHaveLength(7);
    expect(LEVEL_4_WIN.sequence.map((line) => line.text).join(' ')).toMatch(
      /keeping a wild Cosmoid beneath Ironbell/i
    );
    expect(LEVEL_4_WIN.sequence.map((line) => line.text).join(' ')).toMatch(
      /bring it every meal/i
    );
    expect(LEVEL_4_WIN.sequence.at(-2)?.backgroundImageKey).toBe(
      BackgroundImageKey.LEVEL_4_IRONBELL_CELL
    );
    expect(LEVEL_4_WIN.sequence.at(-1)).toMatchObject({
      text: expect.stringMatching(/striped head rises/i),
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_CELL,
    });
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
