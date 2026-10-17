import type { Point } from '@/engine/tower-defense/types';

export const TD_TOUCH_DRAG_OFFSET_PX = 64;

export interface TDDragPointer {
  clientX: number;
  clientY: number;
  pointerType: string;
}

interface DragRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Keep the visible preview and the actual drop target above a touching finger. */
export function getTDDragAimPoint(point: Point, pointerType: string): Point {
  return {
    x: point.x,
    y: point.y - (pointerType === 'touch' ? TD_TOUCH_DRAG_OFFSET_PX : 0),
  };
}

function resolveViewportAim(
  pointer: TDDragPointer,
  rect: DragRect,
  viewport: { width: number; height: number }
): Point | null {
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
  return {
    x: ((clientAim.x - rect.left) / rect.width) * viewport.width,
    y: ((clientAim.y - rect.top) / rect.height) * viewport.height,
  };
}

/** Banner drags scroll at the nearest map edge while the pointer stays on the level. */
export function resolveTDDragScrollAim(
  pointer: TDDragPointer,
  rect: DragRect,
  viewport: { width: number; height: number },
  surface: DragRect = rect
): Point | null {
  if (
    surface.width <= 0 ||
    surface.height <= 0 ||
    pointer.clientX < surface.left ||
    pointer.clientX > surface.left + surface.width ||
    pointer.clientY < surface.top ||
    pointer.clientY > surface.top + surface.height
  )
    return null;
  const aim = resolveViewportAim(pointer, rect, viewport);
  return aim
    ? {
        x: Math.max(0, Math.min(viewport.width, aim.x)),
        y:
          pointer.clientY >= rect.top + rect.height
            ? viewport.height
            : Math.max(0, Math.min(viewport.height, aim.y)),
      }
    : null;
}

/** Resolve a fresh map position after camera movement, zoom or CSS scaling. */
export function resolveTDDragPointer(
  pointer: TDDragPointer,
  rect: DragRect,
  viewport: { width: number; height: number },
  map: { x: number; y: number; width: number; height: number }
): { aim: Point; world: Point | null } | null {
  const aim = resolveViewportAim(pointer, rect, viewport);
  if (!aim) return null;
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
