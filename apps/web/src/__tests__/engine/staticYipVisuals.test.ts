import { AttackId } from '@/types/definitionIds';
import { describe, expect, it, vi } from 'vitest';
import type { Graphics, Sprite } from 'pixi.js';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import {
  drawSparkProjectile,
  drawStaticYipImpact,
  drawStaticYipLaunch,
  drawStaticYipProjectile,
  getElectricAttackFlightProgress,
  getElectricAttackSockets,
} from '@/app/components/tower-defense/electricAttackVisuals';

function sprite(scaleX = 0.48, scaleY = 0.48) {
  return {
    x: 5,
    y: -24,
    scale: { x: scaleX, y: scaleY },
    texture: { orig: { width: 293, height: 224 } },
  } as Sprite;
}

describe('Static Yip visual placement', () => {
  it('mirrors the mouth and ruff across the sprite’s own offset', () => {
    const left = getElectricAttackSockets(sprite(), 'left');
    const right = getElectricAttackSockets(sprite(-0.48), 'right');
    expect(left.mouth.x - 5).toBeCloseTo(-(right.mouth.x - 5));
    expect(left.ruff.x - 5).toBeCloseTo(-(right.ruff.x - 5));
    expect(left.mouth.y).toBe(right.mouth.y);
    expect(left.mouth.x).toBeLessThan(left.ruff.x);
    expect(right.mouth.x).toBeGreaterThan(right.ruff.x);
  });

  it.each(['up', 'down'] as const)(
    'keeps the %s mouth above its ruff',
    (facing) => {
      const sockets = getElectricAttackSockets(sprite(), facing);
      expect(sockets.mouth.y).toBeLessThan(sockets.ruff.y);
      expect(Math.abs(sockets.mouth.x - 5)).toBeLessThan(10);
    }
  );

  it('respects sprite scale without scaling the editor offset twice', () => {
    const small = getElectricAttackSockets(sprite(), 'right');
    const large = getElectricAttackSockets(sprite(-0.96, 0.96), 'right');
    expect(large.mouth.x - 5).toBeCloseTo((small.mouth.x - 5) * 2);
    expect(large.mouth.y + 24).toBeCloseTo((small.mouth.y + 24) * 2);
  });

  it.each([
    [0, 0],
    [5, 0.5],
    [10, 1],
  ])(
    'blends the mouth offset into the impact anchor at x=%s',
    (x, expected) => {
      expect(
        getElectricAttackFlightProgress(
          { x: 0, y: 0 },
          { x, y: 0 },
          { x: 10, y: 0 }
        )
      ).toBe(expected);
    }
  );

  it('handles coincident caster/target positions without NaN', () => {
    const position = { x: 20, y: 20 };
    expect(getElectricAttackFlightProgress(position, position, position)).toBe(
      1
    );
  });
});

function graphicsRecorder() {
  return {
    clear: vi.fn().mockReturnThis(),
    ellipse: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    star: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    position: { set: vi.fn() },
    rotation: 0,
    alpha: 1,
  };
}

describe('Distinct Electric attack visuals', () => {
  const palette = ATTACK_DEFS[AttackId.STATIC_YIP].projectileVisual!;
  if (palette.type !== 'STATIC_YIP')
    throw new Error('Missing Static Yip palette');

  it('draws a hollow, fixed-size tilted ring with crawling rim filaments', () => {
    const early = graphicsRecorder();
    const later = graphicsRecorder();
    drawStaticYipProjectile(early as unknown as Graphics, palette, 0);
    drawStaticYipProjectile(later as unknown as Graphics, palette, 90);
    expect(early.ellipse).toHaveBeenCalledWith(0, 0, 10, 19);
    expect(early.fill).not.toHaveBeenCalled();
    expect(early.rotation).toBe(-0.18);
    expect(later.ellipse.mock.calls).toEqual(early.ellipse.mock.calls);
    expect(later.lineTo.mock.calls).not.toEqual(early.lineTo.mock.calls);
  });

  it('preserves Spark’s original three bolt paths without a bark ring', () => {
    const g = graphicsRecorder();
    drawSparkProjectile(g as unknown as Graphics, palette);
    expect(g.ellipse).not.toHaveBeenCalled();
    expect(g.moveTo).toHaveBeenCalledTimes(12); // Three paths, four stroke layers each.
    expect(g.moveTo).toHaveBeenCalledWith(-13, 1);
    expect(g.moveTo).toHaveBeenCalledWith(-22, -6);
    expect(g.moveTo).toHaveBeenCalledWith(-30, 5);
  });

  it('collapses the impact ring into a central flash, then fades out', () => {
    const early = graphicsRecorder();
    const middle = graphicsRecorder();
    const late = graphicsRecorder();
    drawStaticYipImpact(early as unknown as Graphics, palette, 0);
    drawStaticYipImpact(middle as unknown as Graphics, palette, 0.25);
    drawStaticYipImpact(late as unknown as Graphics, palette, 1);
    expect(middle.ellipse.mock.calls[1][2]).toBeLessThan(
      early.ellipse.mock.calls[1][2]
    );
    expect(middle.ellipse.mock.calls[1][3]).toBeLessThan(
      early.ellipse.mock.calls[1][3]
    );
    expect(late.ellipse).not.toHaveBeenCalled();
    expect(late.star).toHaveBeenCalled();
    expect(late.alpha).toBe(0);
  });

  it.each([0, 0.25, 0.4, 0.6, 0.85, 1])(
    'draws no electrical lines after impact at progress %s',
    (progress) => {
      const g = graphicsRecorder();
      drawStaticYipImpact(g as unknown as Graphics, palette, progress);
      expect(g.moveTo).not.toHaveBeenCalled();
      expect(g.lineTo).not.toHaveBeenCalled();
    }
  );

  it.each(['left', 'right', 'up', 'down'] as const)(
    'starts the %s yip at the mouth',
    (facing) => {
      const g = graphicsRecorder();
      const sockets = getElectricAttackSockets(sprite(), facing);
      drawStaticYipLaunch(
        g as unknown as Graphics,
        palette,
        sockets,
        0,
        facing
      );
      expect(g.position.set).toHaveBeenCalledWith(
        sockets.mouth.x,
        sockets.mouth.y
      );
      expect(g.ellipse).toHaveBeenCalled();
      expect(g.fill).not.toHaveBeenCalled();
    }
  );
});
