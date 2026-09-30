import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Assets, Graphics, Sprite, Texture, TextureSource } from 'pixi.js';
import {
  applyTDUnitTransforms,
  getTDUnitGroundContactOffset,
} from '@/utils/tdUnitVisuals';
import type { BaseTDUnit } from '@/engine/tower-defense/types';
import type { UnitVisuals } from '@/types/baseGame';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';

const configId = 'test_visual_transitions';
const walkConfig = {
  url: '/test-walk.webp',
  scale: 0.25,
  offsetY: -20,
  shadowOffsetX: 4,
  shadowOffsetY: -5,
};
const idleConfig = {
  url: '/test-idle.webp',
  scale: 0.6,
  offsetY: -12,
  shadowOffsetX: 2,
  shadowOffsetY: -3,
};
let original: UnitVisuals | undefined;
beforeEach(() => {
  original = CREATURE_TD_CONFIGS[configId];
  CREATURE_TD_CONFIGS[configId] = {
    default: walkConfig,
    left: walkConfig,
    right: { ...walkConfig, flipX: true },
    idle: idleConfig,
  };
});

function mockTextureLoad() {
  // Select Pixi's single-texture overload rather than its asset-bundle overload.
  return vi.spyOn(
    Assets as { load: (url: string) => Promise<Texture> },
    'load'
  );
}

function deferredTexture() {
  let resolve!: (texture: Texture) => void;
  const promise = new Promise<Texture>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createVisuals() {
  const sprite = new Sprite();
  const shadow = new Graphics();
  const unit: BaseTDUnit = {
    id: 'test_unit',
    position: { x: 50, y: 50 },
    facingDirection: 'left',
    hp: 1,
    maxHp: 1,
  };
  const update = (state: keyof UnitVisuals) =>
    applyTDUnitTransforms(
      unit,
      sprite,
      shadow,
      configId,
      undefined,
      (texture) => {
        sprite.texture = texture;
      },
      state
    );
  return { sprite, shadow, update };
}

const walking = () =>
  new Texture({ source: new TextureSource({ width: 80, height: 120 }) });
const idle = () =>
  new Texture({ source: new TextureSource({ width: 40, height: 50 }) });

afterEach(() => {
  if (original) CREATURE_TD_CONFIGS[configId] = original;
  else delete CREATURE_TD_CONFIGS[configId];
  vi.restoreAllMocks();
});

describe('unit sprite transitions', () => {
  it('keeps the prior texture and layout until the new pose is ready', async () => {
    const walkTexture = walking();
    const idleTexture = idle();
    const pendingIdle = deferredTexture();
    const load = mockTextureLoad()
      .mockResolvedValueOnce(walkTexture)
      .mockReturnValueOnce(pendingIdle.promise);
    const { sprite, shadow, update } = createVisuals();

    update('left');
    await Promise.resolve();
    expect(sprite.height).toBeCloseTo(walkTexture.height * walkConfig.scale);
    const redrawShadow = vi.spyOn(shadow, 'clear');

    update('idle');
    update('idle');
    expect(load).toHaveBeenCalledTimes(2);
    expect(sprite.texture).toBe(walkTexture);
    expect(sprite.height).toBeCloseTo(walkTexture.height * walkConfig.scale);
    expect(sprite.y).toBe(walkConfig.offsetY);
    expect(redrawShadow).not.toHaveBeenCalled();

    pendingIdle.resolve(idleTexture);
    await Promise.resolve();
    expect(sprite.texture).toBe(idleTexture);
    expect(sprite.height).toBeCloseTo(idleTexture.height * idleConfig.scale);
    expect(sprite.y).toBe(idleConfig.offsetY);
    expect(redrawShadow).toHaveBeenCalledOnce();
  });

  it('uses the latest facing when two directions share a pending image', async () => {
    const pending = deferredTexture();
    const load = mockTextureLoad().mockReturnValue(pending.promise);
    const { sprite, update } = createVisuals();
    update('left');
    update('right');
    pending.resolve(walking());
    await Promise.resolve();
    expect(load).toHaveBeenCalledOnce();
    expect(sprite.scale.x).toBe(-walkConfig.scale);

    update('left');
    expect(sprite.scale.x).toBe(walkConfig.scale);
    expect(load).toHaveBeenCalledOnce();
  });

  it('clears temporary pose rotation when the normal layout is reapplied', async () => {
    mockTextureLoad().mockResolvedValue(walking());
    const { sprite, update } = createVisuals();
    update('left');
    await Promise.resolve();

    sprite.rotation = 0.25;
    update('left');

    expect(sprite.rotation).toBe(0);
  });

  it('ignores an obsolete load even when the unit returns to the same URL', async () => {
    const oldWalk = deferredTexture();
    const pendingIdle = deferredTexture();
    const newWalk = deferredTexture();
    mockTextureLoad()
      .mockReturnValueOnce(oldWalk.promise)
      .mockReturnValueOnce(pendingIdle.promise)
      .mockReturnValueOnce(newWalk.promise);
    const { sprite, update } = createVisuals();
    update('left');
    update('idle');
    update('right');
    const currentTexture = walking();
    newWalk.resolve(currentTexture);
    await Promise.resolve();

    pendingIdle.resolve(idle());
    oldWalk.resolve(walking());
    await Promise.resolve();
    expect(sprite.texture).toBe(currentTexture);
    expect(sprite.scale.x).toBe(-walkConfig.scale);
    expect(sprite.height).toBeCloseTo(currentTexture.height * walkConfig.scale);
  });

  it('does not commit a pending image after the sprite is destroyed', async () => {
    const pending = deferredTexture();
    mockTextureLoad().mockReturnValue(pending.promise);
    const { sprite, shadow, update } = createVisuals();
    update('idle');
    sprite.destroy();
    const redrawShadow = vi.spyOn(shadow, 'clear');
    pending.resolve(idle());
    await Promise.resolve();
    expect(redrawShadow).not.toHaveBeenCalled();
  });
});

describe('unit ground contact', () => {
  it('uses the active visual state shadow as the depth anchor', () => {
    const unit: BaseTDUnit = {
      id: 'test_unit',
      position: { x: 50, y: 50 },
      facingDirection: 'left',
      hp: 1,
      maxHp: 1,
    };

    const walkingContact = getTDUnitGroundContactOffset(unit, configId);
    expect(walkingContact.x).toBe(walkConfig.shadowOffsetX);
    expect(walkingContact.y).toBeCloseTo(
      30 * walkConfig.scale + walkConfig.shadowOffsetY
    );

    const idleContact = getTDUnitGroundContactOffset(unit, configId, 'idle');
    expect(idleContact.x).toBe(idleConfig.shadowOffsetX);
    expect(idleContact.y).toBeCloseTo(
      30 * idleConfig.scale + idleConfig.shadowOffsetY
    );
    expect(getTDUnitGroundContactOffset(unit, configId, 'right').x).toBe(
      -walkingContact.x
    );
  });
});
