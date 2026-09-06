import { Container, Graphics, Sprite } from 'pixi.js';
import type { Enemy, Tower } from '@/engine/tower-defense/types';

function graphic(container: Container, label: string) {
  let g = container.getChildByLabel(label) as Graphics | undefined;
  if (!g) {
    g = new Graphics();
    g.label = label;
    g.eventMode = 'none';
    container.addChild(g);
  }
  g.clear();
  return g;
}

function clearGraphic(container: Container, label: string) {
  const g = container.getChildByLabel(label) as Graphics | undefined;
  if (g) {
    container.removeChild(g);
    g.destroy();
  }
}

function breathColor(progress: number) {
  const stops = [0xfa927f, 0xbba4e5, 0x73dbe8, 0x386bc4];
  const t = Math.max(0, Math.min(1, progress)) * 3;
  const a = stops[Math.min(2, Math.floor(t))];
  const b = stops[Math.min(3, Math.floor(t) + 1)];
  const blend = t - Math.min(2, Math.floor(t));
  const channel = (shift: number) =>
    Math.round(
      ((a >> shift) & 255) * (1 - blend) + ((b >> shift) & 255) * blend
    );
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Smooth body-colored coils leave the victim's face and health bar readable. */
export function updateDeepwaterCoils(
  container: Container,
  enemy: Enemy,
  source: Tower | undefined,
  now: number
) {
  const grip = source?.deepwaterGrip;
  const sprite = container.getChildByLabel('enemy_sprite') as
    | Sprite
    | undefined;
  if (!grip || grip.targetId !== enemy.id || !sprite) {
    clearGraphic(container, 'deepwaterCoils');
    return;
  }
  const g = graphic(container, 'deepwaterCoils');
  const progress =
    (now - grip.startedAtMs) / (grip.expiresAtMs - grip.startedAtMs);
  const squeeze = Math.pow(
    Math.max(0, Math.cos(((now - grip.startedAtMs) / 1000) * Math.PI * 2)),
    6
  );
  const radius = Math.max(18, Math.min(65, sprite.width * 0.45)) - squeeze * 2;
  const bottom = sprite.y + sprite.height * (1 - sprite.anchor.y);
  const thickness = Math.max(6, Math.min(12, sprite.height * 0.09));
  for (let i = 0; i < 3; i++) {
    const y = bottom - 9 - i * thickness * 1.25;
    g.ellipse(0, y, radius, thickness * 0.7).stroke({
      color: 0x101e42,
      width: thickness + 3,
    });
    g.ellipse(0, y, radius, thickness * 0.7).stroke({
      color: 0x244975,
      width: thickness,
    });
    g.moveTo(-radius, y).bezierCurveTo(
      -radius,
      y + thickness,
      radius,
      y + thickness,
      radius,
      y
    );
    g.stroke({
      color: 0x9acbdd,
      width: Math.max(2, thickness * 0.3),
      cap: 'round',
    });
  }
  const hp = container.getChildByLabel('hpBg');
  const meterY = (hp?.getLocalBounds().minY ?? -40) - 11;
  g.roundRect(-22, meterY, 44, 5, 2).fill({ color: 0x101e42, alpha: 0.9 });
  g.roundRect(-22, meterY, Math.max(0.1, 44 * (1 - progress)), 5, 2).fill(
    breathColor(progress)
  );
}

/** Crown-colored breathing glow fades toward deep blue as the channel expires. */
export function updateDeepwaterBreath(
  container: Container,
  source: Tower,
  now: number
) {
  const grip = source.deepwaterGrip;
  const sprite = container.getChildByLabel('tower_sprite') as
    | Sprite
    | undefined;
  if (!grip || !sprite) {
    clearGraphic(container, 'deepwaterBreath');
    return;
  }
  const g = graphic(container, 'deepwaterBreath');
  const progress =
    (now - grip.startedAtMs) / (grip.expiresAtMs - grip.startedAtMs);
  const color = breathColor(progress);
  const top = sprite.y - sprite.height * sprite.anchor.y;
  const x = sprite.x + sprite.width * (0.5 - sprite.anchor.x);
  g.ellipse(
    x,
    top + sprite.height * 0.23,
    sprite.width * 0.33,
    sprite.height * 0.2
  )
    .fill({ color, alpha: 0.22 })
    .stroke({ color, alpha: 0.35, width: 2 });
}
