import type { Graphics, Sprite } from 'pixi.js';
import type { ProjectileVisual } from '@/engine/tower-defense/attacks/types';
import type { BaseTDUnit, Point } from '@/engine/tower-defense/types';

type Palette = Extract<ProjectileVisual, { type: 'STATIC_YIP' | 'SPARK' }>;
type Facing = BaseTDUnit['facingDirection'];

/** Texture-relative sockets follow sprite scale, mirroring, and editor offsets. */
export function getElectricAttackSockets(sprite: Sprite, facing: Facing) {
  const width = sprite.texture.orig.width * Math.abs(sprite.scale.x);
  const height = sprite.texture.orig.height * Math.abs(sprite.scale.y);
  const side = facing === 'left' || facing === 'right';
  const sign = facing === 'left' ? -1 : 1;
  return {
    mouth: {
      x: sprite.x + (side ? sign * width * 0.44 : -width * 0.06),
      y: sprite.y + height * (side ? -0.06 : facing === 'up' ? -0.35 : -0.15),
    },
    ruff: {
      x: sprite.x + (side ? sign * width * 0.27 : -width * 0.04),
      y: sprite.y + height * (side ? 0 : facing === 'up' ? -0.18 : 0.01),
    },
  };
}

export function getElectricAttackFlightProgress(
  origin: Point,
  position: Point,
  target: Point
) {
  const travelled = Math.hypot(position.x - origin.x, position.y - origin.y);
  const remaining = Math.hypot(target.x - position.x, target.y - position.y);
  return travelled + remaining > 0 ? travelled / (travelled + remaining) : 1;
}

function strokeBolt(
  g: Graphics,
  points: number[],
  palette: Palette,
  width = 3
) {
  // Layered, antialiased strokes keep the bolt crisp without a costly blur filter.
  for (const [color, thickness, alpha] of [
    [palette.innerColor, width + 5, 0.12],
    [palette.outerColor, width + 1.5, 1],
    [palette.innerColor, width, 1],
    [palette.highlightColor, Math.max(0.8, width * 0.35), 1],
  ]) {
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      g.lineTo(points[i], points[i + 1]);
    g.stroke({ color, width: thickness, alpha, cap: 'round', join: 'round' });
  }
}

export function drawSparkProjectile(g: Graphics, palette: Palette) {
  g.clear();
  strokeBolt(g, [-13, 1, -4, -5, -6, 3, 5, -3, 3, 4, 16, 0], palette, 3.2);
  // These two punctuation-like sparks are part of the drawing, never extra hits.
  strokeBolt(g, [-22, -6, -18, -9, -20, -3], palette, 1.4);
  strokeBolt(g, [-30, 5, -26, 2, -28, 8], palette, 1);
}

export function drawSparkLaunch(
  g: Graphics,
  palette: Palette,
  sockets: ReturnType<typeof getElectricAttackSockets>,
  progress: number
) {
  g.clear();
  const fade = Math.max(0, 1 - progress);
  const flicker = Math.floor(progress * 5) % 2 === 0 ? 1 : 0.6;
  g.alpha = fade * flicker;
  const { ruff, mouth } = sockets;
  // A few short sparks bristle along the ruff instead of covering the whole body.
  for (let i = 0; i < 3; i += 1) {
    const angle = -Math.PI * 0.9 + i * Math.PI * 0.42;
    const x = ruff.x + Math.cos(angle) * 12;
    const y = ruff.y + Math.sin(angle) * 13;
    strokeBolt(
      g,
      [x, y, x + 3, y - 5, x + 6, y - 2, x + 9, y - 8],
      palette,
      1.3
    );
  }
  const radius = 2 + fade * 3;
  g.circle(mouth.x, mouth.y, radius * 1.8).fill({
    color: palette.innerColor,
    alpha: 0.2,
  });
  g.star(mouth.x, mouth.y, 4, radius, radius * 0.3).fill(
    palette.highlightColor
  );
}

export function drawSparkImpact(
  g: Graphics,
  palette: Palette,
  progress: number
) {
  g.clear();
  const fade = Math.max(0, 1 - progress);
  const expansion = Math.min(1, progress * 4);
  g.alpha = fade;
  const radius = 8 + expansion * 8;
  g.star(0, 0, 6, radius, radius * 0.28, 0.2).fill({
    color: palette.innerColor,
    alpha: 0.85,
  });
  g.star(0, 0, 4, radius * 0.65, radius * 0.16).fill(palette.highlightColor);
  for (let i = 0; i < 5; i += 1) {
    const angle = i * Math.PI * 0.4 + 0.3;
    const length = 17 + expansion * 11 + (i % 2) * 4;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    strokeBolt(
      g,
      [
        dx * 7,
        dy * 7,
        dx * length * 0.55 - dy * 3,
        dy * length * 0.55 + dx * 3,
        dx * length * 0.65 + dy * 2,
        dy * length * 0.65 - dx * 2,
        dx * length,
        dy * length,
      ],
      palette,
      1.5
    );
  }
}

/** A hollow, tilted sound pulse: the ring leads, electricity trims its rim. */
function drawBarkRing(
  g: Graphics,
  palette: Palette,
  phase: number,
  size = 1,
  showFilaments = true
) {
  const radiusX = 10 * size;
  const radiusY = 19 * size;
  // A faint, offset echo makes the motion read as a voiced pulse, not an orb.
  g.ellipse(-5 * size, 0, radiusX, radiusY).stroke({
    color: palette.innerColor,
    width: 1.3,
    alpha: 0.25,
  });
  for (const [color, width, alpha] of [
    [palette.innerColor, 8, 0.12],
    [palette.outerColor, 4, 0.65],
    [palette.innerColor, 2.8, 1],
    [palette.highlightColor, 1, 1],
  ]) {
    g.ellipse(0, 0, radiusX, radiusY).stroke({ color, width, alpha });
  }
  if (!showFilaments) return;
  // Short, crawling filaments hug the ring rather than forming another bolt.
  for (let i = 0; i < 3; i += 1) {
    const angle = phase + (i * Math.PI * 2) / 3;
    const points: number[] = [];
    for (let point = 0; point < 5; point += 1) {
      const a = angle + point * 0.13;
      const bristle = point % 2 === 0 ? 1 : 1.22;
      points.push(
        Math.cos(a) * radiusX * bristle,
        Math.sin(a) * radiusY * bristle
      );
    }
    strokeBolt(g, points, palette, 1.1);
  }
}

export function drawStaticYipProjectile(
  g: Graphics,
  palette: Palette,
  elapsedMs: number
) {
  g.clear();
  g.rotation = -0.18;
  drawBarkRing(g, palette, Math.floor(elapsedMs / 45) * 0.6);
}

export function drawStaticYipLaunch(
  g: Graphics,
  palette: Palette,
  sockets: ReturnType<typeof getElectricAttackSockets>,
  progress: number,
  facing: Facing
) {
  g.clear();
  g.position.set(sockets.mouth.x, sockets.mouth.y);
  g.rotation =
    (facing === 'up'
      ? -Math.PI / 2
      : facing === 'down'
        ? Math.PI / 2
        : facing === 'left'
          ? Math.PI
          : 0) - 0.18;
  g.alpha = Math.max(0, 1 - progress);
  // The yip starts at the mouth; the ruff flash belongs to Spark now.
  drawBarkRing(g, palette, progress * 3, 0.28 + progress * 0.4);
}

export function drawStaticYipImpact(
  g: Graphics,
  palette: Palette,
  progress: number
) {
  g.clear();
  g.rotation = -0.18;
  g.alpha = Math.max(0, 1 - Math.max(0, progress - 0.45) / 0.55);
  // Collapse cleanly into a central flash, without electrical lines on the target.
  if (progress < 0.55) {
    drawBarkRing(
      g,
      palette,
      progress * 5,
      Math.max(0.08, 1 - progress / 0.55),
      false
    );
  }
  if (progress > 0.3) {
    const zapProgress = (progress - 0.3) / 0.7;
    const radius = 3 + 6 * Math.sin(zapProgress * Math.PI);
    g.star(0, 0, 4, radius, radius * 0.25).fill(palette.highlightColor);
  }
}
