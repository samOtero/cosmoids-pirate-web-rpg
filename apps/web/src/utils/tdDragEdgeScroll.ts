import type { Point } from '@/engine/tower-defense/types';

export interface TDDragEdgeScrollState {
  x: { direction: number; elapsedMs: number };
  y: { direction: number; elapsedMs: number };
}

export function createTDDragEdgeScrollState(): TDDragEdgeScrollState {
  return {
    x: { direction: 0, elapsedMs: 0 },
    y: { direction: 0, elapsedMs: 0 },
  };
}

const EDGE_BAND_PX = 56;
const INITIAL_SPEED_PX_PER_SECOND = 40;
const MAX_SPEED_PX_PER_SECOND = 440;
const ACCELERATION_SECONDS = 1.2;

function edgeStrength(coordinate: number, extent: number): number {
  const band = Math.min(EDGE_BAND_PX, extent / 4);
  if (band <= 0) return 0;
  if (coordinate < band) return -(1 - coordinate / band);
  if (coordinate > extent - band) return 1 - (extent - coordinate) / band;
  return 0;
}

/** Integrated easing avoids different pan speeds on different refresh rates. */
function travelled(seconds: number): number {
  const accelerating = Math.min(seconds, ACCELERATION_SECONDS);
  const rampDistance = accelerating ** 3 / (3 * ACCELERATION_SECONDS ** 2);
  return (
    INITIAL_SPEED_PX_PER_SECOND * seconds +
    (MAX_SPEED_PX_PER_SECOND - INITIAL_SPEED_PX_PER_SECOND) *
      (rampDistance + Math.max(0, seconds - ACCELERATION_SECONDS))
  );
}

/** Pan only while a tower's aim point stays in a visible viewport edge band. */
export function advanceTDDragEdgeScroll({
  aim,
  viewport,
  scroll,
  maxScroll,
  deltaMs,
  state,
}: {
  aim: Point | null;
  viewport: { width: number; height: number };
  scroll: Point;
  maxScroll: Point;
  deltaMs: number;
  state: TDDragEdgeScrollState;
}): { scroll: Point; state: TDDragEdgeScrollState } {
  if (
    !aim ||
    aim.x < 0 ||
    aim.y < 0 ||
    aim.x > viewport.width ||
    aim.y > viewport.height
  ) {
    return { scroll: { ...scroll }, state: createTDDragEdgeScrollState() };
  }
  let x = edgeStrength(aim.x, viewport.width);
  let y = edgeStrength(aim.y, viewport.height);
  if ((x < 0 && scroll.x <= 0) || (x > 0 && scroll.x >= maxScroll.x)) x = 0;
  if ((y < 0 && scroll.y <= 0) || (y > 0 && scroll.y >= maxScroll.y)) y = 0;
  const magnitude = Math.max(
    1,
    Math.hypot(x, y) / (Math.max(Math.abs(x), Math.abs(y)) || 1)
  );
  const frameMs = Number.isFinite(deltaMs)
    ? Math.max(0, Math.min(deltaMs, 50))
    : 0;
  const nextState = createTDDragEdgeScrollState();
  const nextScroll = { ...scroll };
  for (const [axis, strength] of [
    ['x', x],
    ['y', y],
  ] as const) {
    if (!strength) continue;
    const direction = Math.sign(strength);
    const previousMs =
      state[axis].direction === direction ? state[axis].elapsedMs : 0;
    const elapsedMs = previousMs + frameMs;
    const distance = travelled(elapsedMs / 1000) - travelled(previousMs / 1000);
    nextScroll[axis] = Math.max(
      0,
      Math.min(
        maxScroll[axis],
        scroll[axis] + (distance * strength) / magnitude
      )
    );
    nextState[axis] = {
      direction,
      elapsedMs: Math.min(elapsedMs, ACCELERATION_SECONDS * 1000),
    };
  }
  return { scroll: nextScroll, state: nextState };
}
