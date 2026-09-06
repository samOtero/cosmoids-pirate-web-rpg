import { describe, expect, it } from 'vitest';
import { getTDRangePreviewRadius } from '@/utils/tdAttackRangePreview';

describe('getTDRangePreviewRadius', () => {
  it('keeps the preview circular and independent of battlefield width', () => {
    expect(getTDRangePreviewRadius(25, 900, 1)).toBe(225);
  });

  it('clamps invalid negative ranges to an empty preview', () => {
    expect(getTDRangePreviewRadius(-10, 900, 1)).toBe(0);
  });

  it('scales with camera zoom rather than level background size', () => {
    expect(getTDRangePreviewRadius(20, 900, 0.5)).toBe(90);
  });
});
