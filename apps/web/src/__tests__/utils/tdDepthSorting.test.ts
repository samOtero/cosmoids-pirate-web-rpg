import { describe, expect, it } from 'vitest';
import { calculateTDWorldDepth } from '@/utils/tdDepthSorting';

describe('tower-defense world depth sorting', () => {
  it('puts lower ground contacts in front regardless of horizontal position', () => {
    const upperRight = calculateTDWorldDepth(2000, 100);
    const lowerLeft = calculateTDWorldDepth(0, 101);

    expect(lowerLeft).toBeGreaterThan(upperRight);
  });

  it('uses screen-right position to break equal-height ties', () => {
    const left = calculateTDWorldDepth(400, 100);
    const right = calculateTDWorldDepth(600, 100);

    expect(right).toBeGreaterThan(left);
  });
});
