import { describe, expect, it } from 'vitest';
import { buildTDOffscreenIndicators } from '@/utils/tdOffscreenIndicators';

const insets = { top: 20, right: 20, bottom: 20, left: 20 };

describe('buildTDOffscreenIndicators', () => {
  it('does not create indicators for visible enemies', () => {
    expect(
      buildTDOffscreenIndicators(
        [{ id: 'visible', x: 50, y: 50, isObjectiveCarrier: false }],
        100,
        100,
        insets
      )
    ).toEqual([]);
  });

  it('projects an off-screen enemy onto the safe screen edge', () => {
    const [indicator] = buildTDOffscreenIndicators(
      [{ id: 'right', x: 150, y: 50, isObjectiveCarrier: false }],
      100,
      100,
      insets
    );

    expect(indicator).toMatchObject({
      x: 80,
      y: 50,
      angle: 0,
      count: 1,
      hasObjectiveCarrier: false,
    });
  });

  it('clusters enemies in the same direction and preserves carrier urgency', () => {
    const indicators = buildTDOffscreenIndicators(
      [
        { id: 'one', x: -50, y: 48, isObjectiveCarrier: false },
        { id: 'two', x: -70, y: 52, isObjectiveCarrier: true },
      ],
      100,
      100,
      insets
    );

    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toMatchObject({
      x: 20,
      count: 2,
      hasObjectiveCarrier: true,
    });
  });

  it('defaults to 4 quadrant sections and groups enemies across wide angles on the same side', () => {
    // Top side: center is (50, 50). Top quadrant is roughly -135° to -45°
    const indicators = buildTDOffscreenIndicators(
      [
        { id: 'top-left', x: 20, y: -20, isObjectiveCarrier: false },
        { id: 'top-mid', x: 50, y: -50, isObjectiveCarrier: false },
        { id: 'top-right', x: 80, y: -20, isObjectiveCarrier: false },
      ],
      100,
      100,
      insets
    );

    expect(indicators).toHaveLength(1);
    expect(indicators[0].id).toBe('sector_3');
    expect(indicators[0].y).toBe(20); // Top inset
  });

  it('merges adjacent sector indicators that land close to each other near a corner', () => {
    // Screen is 200x200, center is (100, 100), safe insets are 20px (x in [20, 180], y in [20, 180]).
    // One enemy just below the top-right corner diagonal (Sector 0 / East)
    // One enemy just above the top-right corner diagonal (Sector 3 / North)
    const indicators = buildTDOffscreenIndicators(
      [
        { id: 'near-corner-east', x: 250, y: 70, isObjectiveCarrier: false },
        { id: 'near-corner-north', x: 230, y: -50, isObjectiveCarrier: true },
      ],
      200,
      200,
      insets,
      4,
      80
    );

    // They would otherwise land in separate sectors 0 and 3, but their corner distance is < 80px
    expect(indicators).toHaveLength(1);
    expect(indicators[0].id).toBe('sector_0_3');
    expect(indicators[0].hasObjectiveCarrier).toBe(true);
    expect(indicators[0].count).toBe(2);
  });
});
