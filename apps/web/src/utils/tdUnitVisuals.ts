import * as PIXI from 'pixi.js';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { UnitVisuals } from '@/types/baseGame';
import { BaseTDUnit } from '@/engine/tower-defense/types';

const colorChannel = (color: number, shift: number) =>
  ((color >> shift) & 0xff) / 255;

const spriteVisualStates = new WeakMap<
  PIXI.Sprite,
  {
    url?: string;
    ready: boolean;
    commit: (texture: PIXI.Texture) => void;
  }
>();

export function applyTDUnitTransforms(
  unit: BaseTDUnit,
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  configId: string,
  fallbackUrl?: string,
  onImageLoaded?: (texture: PIXI.Texture) => void,
  visualState?: keyof UnitVisuals
) {
  const tdConfigMap: UnitVisuals = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig =
    tdConfigMap[visualState ?? unit.facingDirection] || tdConfigMap.default;

  const applyLayout = () => {
    const baseScale = tdConfig.scale ?? 1;
    sprite.scale.x = tdConfig.flipX ? -baseScale : baseScale;
    sprite.scale.y = tdConfig.flipY ? -baseScale : baseScale;
    sprite.x = tdConfig.offsetX ?? 0;
    sprite.y = tdConfig.offsetY ?? 0;

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
  };

  const spriteUrl = tdConfig.url || fallbackUrl;
  let visualStateForSprite = spriteVisualStates.get(sprite);
  const needsLoad =
    !visualStateForSprite || visualStateForSprite.url !== spriteUrl;
  if (needsLoad) {
    visualStateForSprite = {
      url: spriteUrl,
      ready: !spriteUrl,
      commit: () => {},
    };
    spriteVisualStates.set(sprite, visualStateForSprite);
  }

  const pendingState = visualStateForSprite!;
  // Keep the old image and layout paired until the new texture is ready.
  // Refresh this closure each frame: left/right can share a URL but differ in flip.
  pendingState.commit = (texture) => {
    onImageLoaded?.(texture);
    applyLayout();
  };
  if (pendingState.ready) applyLayout();
  if (needsLoad && spriteUrl) {
    void PIXI.Assets.load(spriteUrl)
      .then((texture) => {
        if (
          sprite.destroyed ||
          shadow.destroyed ||
          spriteVisualStates.get(sprite) !== pendingState
        ) {
          return;
        }
        pendingState.commit(texture as PIXI.Texture);
        pendingState.ready = true;
      })
      .catch((error: unknown) => {
        console.error(`Failed to load unit sprite: ${spriteUrl}`, error);
      });
  }

  if ((unit.damageFlashTimerMs || 0) > 0) {
    sprite.tint = 0xffffff;
    const flashColor = unit.damageFlashColor ?? 0xffffff;
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
      0,
      0,
      0,
      0,
      colorChannel(flashColor, 16),
      0,
      0,
      0,
      0,
      colorChannel(flashColor, 8),
      0,
      0,
      0,
      0,
      colorChannel(flashColor, 0),
      0,
      0,
      0,
      1,
      0,
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
