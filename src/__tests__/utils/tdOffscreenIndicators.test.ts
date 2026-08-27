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
});
