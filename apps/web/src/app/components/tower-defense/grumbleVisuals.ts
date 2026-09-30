import type { Graphics } from 'pixi.js';
import type { ProjectileVisual } from '@/engine/tower-defense/attacks/types';
import type { BaseTDUnit } from '@/engine/tower-defense/types';
import { getElectricAttackSockets } from './electricAttackVisuals';

type Palette = Extract<ProjectileVisual, { type: 'GRUMBLE' }>;
type Facing = BaseTDUnit['facingDirection'];

function drawSoundPulse(g: Graphics, palette: Palette, scale: number) {
  // A complete hollow ring keeps the travelling rumble legible from any angle.
  const radius = 15 * scale;
  g.circle(0, 0, radius).stroke({
    color: palette.outerColor,
    width: 8 * scale,
    alpha: 0.24,
  });
  g.circle(0, 0, radius).stroke({
    color: palette.innerColor,
    width: 3.5 * scale,
    alpha: 0.95,
  });
  g.circle(0, 0, radius).stroke({
    color: palette.highlightColor,
    width: 1.2 * scale,
    alpha: 0.85,
  });
  g.circle(0, 0, radius * 0.62).stroke({
    color: palette.innerColor,
    width: 1.2 * scale,
    alpha: 0.35,
  });
}

export function drawGrumbleProjectile(g: Graphics, palette: Palette) {
  g.clear();
  drawSoundPulse(g, palette, 1);
}

export function drawGrumbleLaunch(
  g: Graphics,
  palette: Palette,
  sockets: ReturnType<typeof getElectricAttackSockets>,
  progress: number,
  facing: Facing
) {
  g.clear();
  g.position.set(sockets.mouth.x, sockets.mouth.y);
  g.rotation =
    facing === 'up'
      ? -Math.PI / 2
      : facing === 'down'
        ? Math.PI / 2
        : facing === 'left'
          ? Math.PI
          : 0;
  g.alpha = Math.max(0, 1 - progress);
  drawSoundPulse(g, palette, 0.25 + progress * 0.35);
}

export function drawGrumbleImpact(
  g: Graphics,
  palette: Palette,
  progress: number
) {
  g.clear();
  g.alpha = Math.max(0, 1 - progress);
  const radius = 5 + progress * 19;
  g.circle(0, 0, radius).stroke({
    color: palette.outerColor,
    width: 6,
    alpha: 0.2,
  });
  g.circle(0, 0, radius).stroke({
    color: palette.innerColor,
    width: 2.5,
    alpha: 0.85,
  });
  g.circle(0, 0, radius * 0.56).stroke({
    color: palette.highlightColor,
    width: 1.3,
    alpha: 0.7,
  });
}
