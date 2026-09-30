import { Container, Graphics } from 'pixi.js';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { Tower } from '@/engine/tower-defense/types';
import { isWarmthFamilyTower, WARMTH_MAX } from '@/engine/tower-defense/warmth';
import { ElementType } from '@/types/baseGame';

function isWaterMoveSelected(tower: Tower): boolean {
  const runtime = tower.equippedAttacksRuntime[tower.selectedAttackIndex];
  return Boolean(
    runtime && ATTACK_DEFS[runtime.definitionId]?.type === ElementType.WATER
  );
}

function drawSun(graphics: Graphics, color: number) {
  graphics.circle(0, 0, 3.7).fill({ color, alpha: 0.98 });
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    graphics
      .moveTo(Math.cos(angle) * 5.2, Math.sin(angle) * 5.2)
      .lineTo(Math.cos(angle) * 7.1, Math.sin(angle) * 7.1)
      .stroke({ color, width: 1.4, cap: 'round', alpha: 0.96 });
  }
}

export function updateWarmthIndicator(
  container: Container,
  tower: Tower,
  currentTimeMs: number
) {
  let badge = container.getChildByLabel('warmth_indicator') as
    | Graphics
    | undefined;
  if (!isWarmthFamilyTower(tower)) {
    if (badge) {
      container.removeChild(badge);
      badge.destroy();
    }
    return;
  }

  if (!badge) {
    badge = new Graphics();
    badge.label = 'warmth_indicator';
    container.addChild(badge);
  }

  const warmth = Math.max(0, Math.min(WARMTH_MAX, tower.warmth?.value ?? 0));
  const progress = warmth / WARMTH_MAX;
  const waterSelected = isWaterMoveSelected(tower);
  const configMap = CREATURE_TD_CONFIGS[tower.creature.speciesId];
  const config = configMap?.[tower.facingDirection] ?? configMap?.default;
  badge.position.set(33, (config?.healthBarOffsetY ?? -40) - 15);
  badge.clear();

  badge
    .circle(0, 0, 10)
    .fill({ color: waterSelected ? 0x203d4a : 0x49351d, alpha: 0.94 })
    .stroke({ color: waterSelected ? 0x96eaff : 0xffdf95, width: 1.6 });
  badge.circle(0, 0, 13).stroke({
    color: waterSelected ? 0x173541 : 0x2b2115,
    width: 4.5,
    alpha: 0.9,
  });

  if (progress >= 0.999) {
    badge.circle(0, 0, 13).stroke({
      color: 0xffc45c,
      width: 3.2,
      alpha: 1,
    });
  } else if (progress > 0) {
    badge
      .moveTo(0, -13)
      .arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
      .stroke({ color: 0xffc45c, width: 3.2, cap: 'round' });
  }

  drawSun(badge, waterSelected ? 0xffdf86 : 0xffd36b);

  if (tower.warmth?.sunSoaked) {
    const pulse = 0.72 + Math.sin(currentTimeMs / 170) * 0.18;
    badge.circle(0, 0, 16).stroke({
      color: 0xfff2ad,
      width: 2.2,
      alpha: pulse,
    });
  }
}
