import { describe, expect, it, vi } from 'vitest';
import type { Graphics, Sprite } from 'pixi.js';
import { drawGrumbleProjectile } from '@/app/components/tower-defense/grumbleVisuals';
import {
  drawReverieOrbProjectile,
  getDormateeOrbSocket,
  getReverieOrbWaveOffset,
} from '@/app/components/tower-defense/reverieOrbVisuals';

const colors = {
  outerColor: 0x112233,
  innerColor: 0x445566,
  highlightColor: 0xffffff,
};

describe('Procedural projectile visuals', () => {
  it('draws a travelling pulse as complete circles', () => {
    const graphics = {
      clear: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
    };
    drawGrumbleProjectile(graphics as unknown as Graphics, {
      type: 'GRUMBLE',
      ...colors,
    });
    expect(graphics.clear).toHaveBeenCalledOnce();
    expect(graphics.circle).toHaveBeenCalled();
    for (const [x, y, radius] of graphics.circle.mock.calls) {
      expect([x, y]).toEqual([0, 0]);
      expect(radius).toBeGreaterThan(0);
    }
    expect(graphics.stroke).toHaveBeenCalled();
  });

  it('mirrors directional launch sockets with the sprite', () => {
    const side = {
      x: 0,
      y: -42,
      scale: { x: 0.38, y: 0.38 },
      texture: { orig: { width: 360, height: 240 } },
    } as Sprite;
    const left = getDormateeOrbSocket(side, 'left');
    const right = getDormateeOrbSocket(side, 'right');
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.y).toBe(right.y);
    const front = {
      x: 0,
      y: -47,
      scale: { x: 0.38, y: 0.38 },
      texture: { orig: { width: 200, height: 275 } },
    } as Sprite;
    expect(getDormateeOrbSocket(front, 'up').x).toBeLessThan(0);
    expect(getDormateeOrbSocket(front, 'down').x).toBeGreaterThan(0);
  });

  it('waves perpendicular to travel while preserving endpoints and zero-distance safety', () => {
    expect(getReverieOrbWaveOffset(0, 100, 0)).toEqual({ x: 0, y: 0 });
    expect(getReverieOrbWaveOffset(1, 100, 0)).toEqual({ x: 0, y: 0 });
    expect(getReverieOrbWaveOffset(0.25, 100, 0).y).toBeGreaterThan(0);
    expect(getReverieOrbWaveOffset(0.75, 100, 0).y).toBeLessThan(0);
    expect(getReverieOrbWaveOffset(0.25, 0, -100).x).toBeGreaterThan(0);
    expect(getReverieOrbWaveOffset(0.25, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('draws the animated orb with a supplied palette', () => {
    const graphics = {
      clear: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
    };
    drawReverieOrbProjectile(
      graphics as unknown as Graphics,
      { type: 'REVERIE_ORB', ...colors },
      200
    );
    expect(graphics.circle).toHaveBeenCalled();
    expect(graphics.fill).toHaveBeenCalled();
  });
});
