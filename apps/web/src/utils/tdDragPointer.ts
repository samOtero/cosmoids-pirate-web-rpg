import type { Point } from '@/engine/tower-defense/types';

export const TD_TOUCH_DRAG_OFFSET_PX = 64;

export interface TDDragPointer {
  clientX: number;
  clientY: number;
  pointerType: string;
}

/** Keep the visible preview and the actual drop target above a touching finger. */
export function getTDDragAimPoint(point: Point, pointerType: string): Point {
  return {
    x: point.x,
    y: point.y - (pointerType === 'touch' ? TD_TOUCH_DRAG_OFFSET_PX : 0),
  };
}

/** Resolve a fresh map position after camera movement, zoom or CSS scaling. */
export function resolveTDDragPointer(
  pointer: TDDragPointer,
  rect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
  map: { x: number; y: number; width: number; height: number }
): { aim: Point; world: Point | null } | null {
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  )
    return null;
  const clientAim = getTDDragAimPoint(
    { x: pointer.clientX, y: pointer.clientY },
    pointer.pointerType
  );
  const aim = {
    x: ((clientAim.x - rect.left) / rect.width) * viewport.width,
    y: ((clientAim.y - rect.top) / rect.height) * viewport.height,
  };
  if (
    aim.x < 0 ||
    aim.x > viewport.width ||
    aim.y < 0 ||
    aim.y > viewport.height ||
    map.width <= 0 ||
    map.height <= 0
  )
    return { aim, world: null };
  const world = {
    x: ((aim.x - map.x) / map.width) * 100,
    y: ((aim.y - map.y) / map.height) * 100,
  };
  return {
    aim,
    world:
      world.x >= 0 && world.x <= 100 && world.y >= 0 && world.y <= 100
        ? world
        : null,
  };
}
