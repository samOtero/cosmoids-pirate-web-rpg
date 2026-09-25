import { afterEach, describe, expect, it, vi } from 'vitest';
import { Assets, Graphics, Sprite, Texture, TextureSource } from 'pixi.js';
import {
  applyTDUnitTransforms,
  getTDUnitGroundContactOffset,
} from '@/utils/tdUnitVisuals';
import type { BaseTDUnit } from '@/engine/tower-defense/types';
import type { UnitVisuals } from '@/types/baseGame';

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
    id: 'caleb',
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
      'caleb_capture',
      undefined,
      (texture) => {
        sprite.texture = texture;
      },
      state
    );
  return { sprite, shadow, update };
}

const walking = () =>
  new Texture({ source: new TextureSource({ width: 1024, height: 1536 }) });
const idle = () =>
  new Texture({ source: new TextureSource({ width: 172, height: 249 }) });

afterEach(() => vi.restoreAllMocks());

describe('unit sprite transitions', () => {
  it('keeps Caleb at walking size until the idle image and layout can switch together', async () => {
    const walkTexture = walking();
    const idleTexture = idle();
    const pendingIdle = deferredTexture();
    const load = mockTextureLoad()
      .mockResolvedValueOnce(walkTexture)
      .mockReturnValueOnce(pendingIdle.promise);
    const { sprite, shadow, update } = createVisuals();

    update('left');
    await Promise.resolve();
    expect(sprite.height).toBeCloseTo(1536 * 0.12);
    const redrawShadow = vi.spyOn(shadow, 'clear');

    update('idle');
    update('idle');
    expect(load).toHaveBeenCalledTimes(2);
    expect(sprite.texture).toBe(walkTexture);
    expect(sprite.height).toBeCloseTo(1536 * 0.12);
    expect(sprite.y).toBe(-87);
    expect(redrawShadow).not.toHaveBeenCalled();

    pendingIdle.resolve(idleTexture);
    await Promise.resolve();
    expect(sprite.texture).toBe(idleTexture);
    expect(sprite.height).toBeCloseTo(249 * 0.68);
    expect(sprite.y).toBe(-95);
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
    expect(sprite.scale.x).toBe(-0.12);

    update('left');
    expect(sprite.scale.x).toBe(0.12);
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
    expect(sprite.scale.x).toBe(-0.12);
    expect(sprite.height).toBeCloseTo(1536 * 0.12);
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
      id: 'caleb',
      position: { x: 50, y: 50 },
      facingDirection: 'left',
      hp: 1,
      maxHp: 1,
    };

    const walkingContact = getTDUnitGroundContactOffset(
      unit,
      'caleb_capture'
    );
    expect(walkingContact.x).toBe(0);
    expect(walkingContact.y).toBeCloseTo(-9.4);

    const idleContact = getTDUnitGroundContactOffset(
      unit,
      'caleb_capture',
      'idle'
    );
    expect(idleContact.x).toBe(0);
    expect(idleContact.y).toBeCloseTo(-11.6);
  });
});
