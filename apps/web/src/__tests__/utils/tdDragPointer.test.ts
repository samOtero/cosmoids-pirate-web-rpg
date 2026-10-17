import { describe, expect, it } from 'vitest';
import { getTDDragAimPoint, resolveTDDragPointer } from '@/utils/tdDragPointer';

describe('battlefield drag aiming', () => {
  const rect = { left: 100, top: 50, width: 800, height: 400 };
  const viewport = { width: 800, height: 400 };
  const map = { x: 0, y: 0, width: 800, height: 400 };

  it('raises touch aiming while leaving mouse and pen aiming precise', () => {
    const pointer = { x: 300, y: 300 };
    const touch = getTDDragAimPoint(pointer, 'touch');
    expect(touch.x).toBe(pointer.x);
    expect(touch.y).toBeLessThan(pointer.y - 40);
    expect(getTDDragAimPoint(pointer, 'mouse')).toEqual(pointer);
    expect(getTDDragAimPoint(pointer, 'pen')).toEqual(pointer);
  });

  it('uses the visible raised aim to resolve the map target', () => {
    const aim = getTDDragAimPoint({ x: 500, y: 314 }, 'touch');
    const position = resolveTDDragPointer(
      { clientX: 500, clientY: 314, pointerType: 'touch' },
      rect,
      viewport,
      map
    )!;
    expect(position.aim).toEqual({ x: aim.x - rect.left, y: aim.y - rect.top });
    expect(position.world).toEqual({ x: 50, y: 50 });
  });

  it('updates a stationary pointer target as the camera scrolls and zooms', () => {
    const pointer = { clientX: 500, clientY: 250, pointerType: 'mouse' };
    const original = resolveTDDragPointer(pointer, rect, viewport, map)!;
    const panned = resolveTDDragPointer(pointer, rect, viewport, {
      ...map,
      x: -200,
      y: -100,
    })!;
    expect(panned.aim).toEqual(original.aim);
    expect(panned.world!.x).toBeGreaterThan(original.world!.x);
    expect(panned.world!.y).toBeGreaterThan(original.world!.y);
    const zoomed = resolveTDDragPointer(pointer, rect, viewport, {
      ...map,
      width: 1600,
      height: 800,
    })!;
    expect(zoomed.world).toEqual({ x: 25, y: 25 });
  });

  it('keeps touch clearance in CSS pixels when the canvas is scaled', () => {
    const pointer = { clientX: 300, clientY: 214, pointerType: 'touch' };
    const position = resolveTDDragPointer(
      pointer,
      { ...rect, width: 400, height: 200 },
      viewport,
      map
    )!;
    expect(position.world).toEqual({ x: 50, y: 50 });
  });

  it('rejects targets outside the viewport or letterboxed map and empty layouts', () => {
    const pointer = { clientX: 20, clientY: 300, pointerType: 'mouse' };
    expect(
      resolveTDDragPointer(pointer, rect, viewport, map)!.world
    ).toBeNull();
    expect(
      resolveTDDragPointer({ ...pointer, clientX: 110 }, rect, viewport, {
        ...map,
        x: 50,
        width: 700,
      })!.world
    ).toBeNull();
    expect(
      resolveTDDragPointer(pointer, { ...rect, width: 0 }, viewport, map)
    ).toBeNull();
  });
});
