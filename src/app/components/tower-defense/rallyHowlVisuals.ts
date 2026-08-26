import { Container, Graphics } from 'pixi.js';
import type { Tower } from '@/engine/tower-defense/types';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { getAttackSpeedMultiplier } from '@/engine/tower-defense/attackSpeedModifiers';

/** Exactly two warm, staggered sound pulses; no electrical spokes or sparks. */
export function drawRallyHowlRings(
  g: Graphics,
  progress: number,
  maxRadius: number
) {
  g.clear();
  for (let index = 0; index < 2; index += 1) {
    const p = (progress - index * 0.18) / 0.82;
    if (p <= 0 || p >= 1) continue;
    const radius = 4 + (maxRadius - 4) * (1 - Math.pow(1 - p, 2));
    const alpha = Math.min(1, p * 9) * Math.min(1, (1 - p) * 4);
    g.circle(0, 0, radius).stroke({
      color: 0xf4c979,
      width: 7,
      alpha: alpha * 0.15,
    });
    g.circle(0, 0, radius).stroke({
      color: index === 0 ? 0xffedbd : 0xeabb6c,
      width: 2.8,
      alpha: alpha * 0.9,
    });
  }
}

export function updateRallyIndicator(
  container: Container,
  tower: Tower,
  currentTimeMs: number
) {
  let badge = container.getChildByLabel('rally_indicator') as
    | Graphics
    | undefined;
  if (
    getAttackSpeedMultiplier(tower, currentTimeMs) <= 1 ||
    !tower.attackSpeedBuff
  ) {
    if (badge) {
      container.removeChild(badge);
      badge.destroy();
    }
    return;
  }
  if (!badge) {
    badge = new Graphics();
    badge.label = 'rally_indicator';
    container.addChild(badge);
  }
  const buff = tower.attackSpeedBuff;
  const arrival = Math.max(0, 1 - (currentTimeMs - buff.appliedAtMs) / 450);
  const configMap = CREATURE_TD_CONFIGS[tower.creature.speciesId];
  const config = configMap?.[tower.facingDirection] ?? configMap?.default;
  badge.position.set(-33, (config?.healthBarOffsetY ?? -40) - 15 - arrival * 8);
  badge.scale.set(1 + arrival * 0.25);
  badge.alpha = Math.min(1, (buff.expiresAtMs - currentTimeMs) / 250);
  badge.clear();
  badge
    .circle(0, 0, 10)
    .fill({ color: 0x49351d, alpha: 0.94 })
    .stroke({ color: 0xffdf95, width: 1.6 });
  // A dark track keeps the timer readable, while the bright arc shrinks with it.
  badge.circle(0, 0, 13).stroke({ color: 0x2b2115, width: 4.5, alpha: 0.85 });
  // Twin upward chevrons show the received rally.
  for (const y of [-2, 4]) {
    badge
      .moveTo(-4, y + 2)
      .lineTo(0, y - 2)
      .lineTo(4, y + 2)
      .stroke({ color: 0xffedbd, width: 1.8, cap: 'round', join: 'round' });
  }
  const remaining = Math.max(
    0,
    Math.min(
      1,
      (buff.expiresAtMs - currentTimeMs) / (buff.expiresAtMs - buff.appliedAtMs)
    )
  );
  badge
    .moveTo(0, -13)
    .arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining)
    .stroke({ color: 0xffe3a1, width: 3.2, cap: 'round' });
}
