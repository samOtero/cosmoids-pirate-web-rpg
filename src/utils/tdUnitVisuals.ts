import * as PIXI from 'pixi.js';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { BaseTDUnit } from '@/engine/tower-defense/types';

export function applyTDUnitTransforms(
  unit: BaseTDUnit,
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  configId: string,
  fallbackUrl?: string,
  onImageLoaded?: (texture: PIXI.Texture) => void
) {
  const tdConfigMap = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;

  const baseScale = tdConfig.scale ?? 1;
  sprite.scale.x = tdConfig.flipX ? -baseScale : baseScale;
  sprite.scale.y = tdConfig.flipY ? -baseScale : baseScale;
  sprite.x = tdConfig.offsetX ?? 0;
  sprite.y = tdConfig.offsetY ?? 0;

  const spriteUrl = tdConfig.url || fallbackUrl;
  if (
    spriteUrl &&
    (sprite as PIXI.Sprite & { currentUrl?: string }).currentUrl !== spriteUrl
  ) {
    (sprite as PIXI.Sprite & { currentUrl?: string }).currentUrl = spriteUrl;
    void PIXI.Assets.load(spriteUrl).then((texture) => {
      onImageLoaded?.(texture as PIXI.Texture);
    });
  }

  const shadowOffsetX = tdConfig.shadowOffsetX ?? 0;
  const shadowOffsetY = tdConfig.shadowOffsetY ?? 0;

  shadow.clear();
  shadow.ellipse(
    shadowOffsetX,
    30 * baseScale + shadowOffsetY,
    25 * (tdConfig.shadowScaleX ?? 1),
    12 * (tdConfig.shadowScaleY ?? 1)
  );
  shadow.fill({ color: 0x000000, alpha: 0.4 });
  shadow.scale.x = tdConfig.flipX ? -1 : 1;

  if ((unit.damageFlashTimerMs || 0) > 0) {
    sprite.tint = 0xffffff;
    const currentFilters = Array.isArray(sprite.filters)
      ? [...sprite.filters]
      : sprite.filters
        ? [sprite.filters]
        : [];
    let flashFilter = currentFilters.find(
      (filter: PIXI.Filter & { __isDamageFlash?: boolean }) =>
        filter.__isDamageFlash
    ) as (PIXI.ColorMatrixFilter & { __isDamageFlash?: boolean }) | undefined;

    if (!flashFilter) {
      flashFilter = new PIXI.ColorMatrixFilter();
      flashFilter.__isDamageFlash = true;
      currentFilters.push(flashFilter);
      sprite.filters = currentFilters;
    }
    flashFilter.matrix = [
      0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0,
    ];
  } else {
    sprite.tint = 0xffffff;
    if (sprite.filters) {
      const currentFilters = Array.isArray(sprite.filters)
        ? [...sprite.filters]
        : [sprite.filters];
      const nextFilters = currentFilters.filter(
        (filter: PIXI.Filter & { __isDamageFlash?: boolean }) =>
          !filter.__isDamageFlash
      );
      sprite.filters = nextFilters.length > 0 ? nextFilters : [];
    }
  }
}
