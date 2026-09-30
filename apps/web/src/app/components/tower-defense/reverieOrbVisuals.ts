import type { Graphics, Sprite } from 'pixi.js';
import type { ProjectileVisual } from '@/engine/tower-defense/attacks/types';
import type { BaseTDUnit } from '@/engine/tower-defense/types';

type Palette = Extract<ProjectileVisual, { type: 'REVERIE_ORB' }>;
type Facing = BaseTDUnit['facingDirection'];

/** The pearl sits in different corners of Dormatee's side, front, and back art. */
export function getDormateeOrbSocket(sprite: Sprite, facing: Facing) {
  const width = sprite.texture.orig.width * Math.abs(sprite.scale.x);
  const height = sprite.texture.orig.height * Math.abs(sprite.scale.y);
  if (facing === 'up') {
    return { x: sprite.x - width * 0.31, y: sprite.y - height * 0.41 };
  }
  if (facing === 'down') {
    return { x: sprite.x + width * 0.35, y: sprite.y - height * 0.37 };
  }
  return {
    x: sprite.x + (facing === 'left' ? -1 : 1) * width * 0.28,
    y: sprite.y - height * 0.35,
  };
}

/** One gentle crest and trough perpendicular to travel, with exact endpoints. */
export function getReverieOrbWaveOffset(
  progress: number,
  travelX: number,
  travelY: number
) {
  const flight = Math.max(0, Math.min(1, progress));
  if (flight === 0 || flight === 1) return { x: 0, y: 0 };
  const distance = Math.hypot(travelX, travelY);
  if (distance === 0) return { x: 0, y: 0 };
  const swell =
    Math.sin(flight * Math.PI * 2) * Math.sin(flight * Math.PI) * 18;
  return {
    x: (-travelY / distance) * swell,
    y: (travelX / distance) * swell,
  };
}

export function drawReverieOrbProjectile(
  g: Graphics,
  palette: Palette,
  elapsedMs: number
) {
  g.clear();
  const breathe = Math.sin(elapsedMs * 0.006) * 1.1;
  g.circle(0, 0, 20 + breathe).fill({
    color: palette.outerColor,
    alpha: 0.18,
  });
  g.circle(0, 0, 14 + breathe * 0.4).fill({
    color: palette.outerColor,
    alpha: 0.72,
  });
  g.circle(0, 0, 11 + breathe * 0.3).fill({
    color: palette.innerColor,
    alpha: 0.96,
  });
  g.circle(0, 0, 14 + breathe * 0.4).stroke({
    color: palette.highlightColor,
    alpha: 0.8,
    width: 1.5,
  });
  g.circle(-4, -4, 4).fill({ color: palette.highlightColor, alpha: 0.85 });
  g.circle(5, 5, 2).fill({ color: 0xb5f0ff, alpha: 0.8 });
}

export function drawReverieOrbLaunch(
  g: Graphics,
  palette: Palette,
  socket: { x: number; y: number },
  progress: number
) {
  g.clear();
  g.position.set(socket.x, socket.y);
  g.alpha = Math.max(0, 1 - progress);
  g.circle(0, 0, 12 + progress * 19).stroke({
    color: palette.innerColor,
    width: 3,
    alpha: 0.8,
  });
  g.circle(0, 0, 6 + progress * 9).stroke({
    color: palette.highlightColor,
    width: 1.3,
    alpha: 0.7,
  });
}

export function drawReverieOrbImpact(
  g: Graphics,
  palette: Palette,
  progress: number
) {
  g.clear();
  g.alpha = Math.max(0, 1 - progress);
  const radius = 9 + progress * 23;
  g.circle(0, 0, radius).fill({
    color: palette.outerColor,
    alpha: 0.13,
  });
  g.circle(0, 0, radius).stroke({
    color: palette.innerColor,
    alpha: 0.85,
    width: 2.5,
  });
  g.circle(0, 0, radius * 0.55).stroke({
    color: palette.highlightColor,
    alpha: 0.8,
    width: 1.5,
  });
}
