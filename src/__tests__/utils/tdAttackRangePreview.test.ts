import { describe, expect, it } from 'vitest';
import { getTDRangePreviewRadii } from '@/utils/tdAttackRangePreview';

describe('getTDRangePreviewRadii', () => {
  it('maps normalized attack range onto both battlefield axes', () => {
    expect(getTDRangePreviewRadii(25, 1600, 900)).toEqual({
      x: 400,
      y: 225,
    });
  });

  it('clamps invalid negative ranges to an empty preview', () => {
    expect(getTDRangePreviewRadii(-10, 1600, 900)).toEqual({ x: 0, y: 0 });
  });
});
