import { describe, expect, it } from 'vitest';
import {
  advanceTDDragEdgeScroll,
  createTDDragEdgeScrollState,
} from '@/utils/tdDragEdgeScroll';

const setup = () => ({
  aim: { x: 399, y: 150 } as { x: number; y: number } | null,
  viewport: { width: 400, height: 300 },
  scroll: { x: 500, y: 500 },
  maxScroll: { x: 2000, y: 2000 },
  deltaMs: 20,
  state: createTDDragEdgeScrollState(),
});
function run(frames: number, input = setup()) {
  let current = input;
  for (let i = 0; i < frames; i++)
    current = { ...current, ...advanceTDDragEdgeScroll(current) };
  return current;
}

describe('drag edge scrolling', () => {
  it('starts slowly and accelerates while the tower is held still at an edge', () => {
    const input = setup();
    const early = run(5, input).scroll.x - input.scroll.x;
    const warm = run(60, input);
    const late = run(5, warm).scroll.x - warm.scroll.x;
    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThan(early * 3);
    expect(warm.scroll.y).toBe(input.scroll.y);
  });

  it('stops immediately away from the edge, outside the canvas, or after release', () => {
    const warm = run(60);
    for (const aim of [{ x: 200, y: 150 }, { x: 410, y: 150 }, null]) {
      const result = advanceTDDragEdgeScroll({ ...warm, aim });
      expect(result.scroll).toEqual(warm.scroll);
      expect(result.state).toEqual(createTDDragEdgeScrollState());
    }
  });

  it('starts slowly again after leaving an edge or reversing direction', () => {
    const warm = run(60);
    const reversed = run(5, { ...warm, aim: { x: 1, y: 150 } });
    const restarted = run(5, { ...warm, state: createTDDragEdgeScrollState() });
    const initial = setup();
    expect(warm.scroll.x - reversed.scroll.x).toBeCloseTo(
      run(5, { ...initial, aim: { x: 1, y: 150 } }).scroll.x * -1 +
        initial.scroll.x
    );
    expect(restarted.scroll.x - warm.scroll.x).toBeCloseTo(
      run(5, initial).scroll.x - initial.scroll.x
    );
  });

  it('supports all four edges and diagonal movement without moving beyond map limits', () => {
    const input = setup();
    expect(run(5, { ...input, aim: { x: 1, y: 150 } }).scroll.x).toBeLessThan(
      input.scroll.x
    );
    expect(run(5, { ...input, aim: { x: 200, y: 1 } }).scroll.y).toBeLessThan(
      input.scroll.y
    );
    expect(
      run(5, { ...input, aim: { x: 200, y: 299 } }).scroll.y
    ).toBeGreaterThan(input.scroll.y);
    const diagonal = run(5, { ...input, aim: { x: 399, y: 299 } });
    expect(diagonal.scroll.x).toBeGreaterThan(input.scroll.x);
    expect(diagonal.scroll.y).toBeGreaterThan(input.scroll.y);
    expect(
      Math.hypot(
        diagonal.scroll.x - input.scroll.x,
        diagonal.scroll.y - input.scroll.y
      )
    ).toBeCloseTo(run(5, input).scroll.x - input.scroll.x, 1);
    const limit = run(100, {
      ...input,
      aim: { x: 399, y: 299 },
      maxScroll: { x: 503, y: 507 },
    });
    expect(limit.scroll).toEqual({ x: 503, y: 507 });
  });

  it('does not move on an axis where the map fits, while allowing the other axis to pan', () => {
    const input = {
      ...setup(),
      aim: { x: 1, y: 299 },
      scroll: { x: 0, y: 0 },
      maxScroll: { x: 0, y: 1000 },
    };
    const result = run(40, input);
    expect(result.scroll.x).toBe(0);
    expect(result.state.x.elapsedMs).toBe(0);
    expect(result.scroll.y).toBeGreaterThan(0);
  });

  it('uses elapsed time rather than frame count and caps pauses to avoid camera jumps', () => {
    const input = setup();
    const slow = run(50, { ...input, deltaMs: 20 });
    const fast = run(100, { ...input, deltaMs: 10 });
    expect(slow.scroll.x).toBeCloseTo(fast.scroll.x);
    const stalled = advanceTDDragEdgeScroll({ ...input, deltaMs: 5000 });
    expect(stalled.scroll.x - input.scroll.x).toBeLessThan(5);
  });
});
