import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import type { Projectile } from '@/engine/tower-defense/types';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';

export const BARREL_BOWLING_ASSETS = {
  horizontal: '/battles/attacks/barrel_bowling_horizontal.webp',
  vertical: '/battles/attacks/barrel_bowling_vertical.webp',
};

export function createBarrelBowlingVisual(container: Container) {
  const shadow = new Graphics();
  shadow.label = 'barrel_shadow';
  shadow.ellipse(0, 0, 23, 7).fill({ color: 0x182d38, alpha: 0.3 });
  container.addChild(shadow);
  const wake = new Graphics();
  wake.label = 'barrel_wake';
  container.addChild(wake);
  for (const [direction, url] of Object.entries(BARREL_BOWLING_ASSETS)) {
    const sprite = new Sprite();
    sprite.label = `barrel_${direction}`;
    sprite.anchor.set(0.5);
    container.addChild(sprite);
    Assets.load(url)
      .then((texture) => {
        if (!sprite.destroyed) sprite.texture = texture;
      })
      .catch((error: unknown) =>
        console.error(`Could not load barrel sprite: ${url}`, error)
      );
  }
}

export function updateBarrelBowlingVisual(
  container: Container,
  projectile: Projectile,
  attackDef: AttackDefinition
) {
  const barrel = projectile.rollingBarrel!;
  const horizontal =
    projectile.facingDirection === 'left' ||
    projectile.facingDirection === 'right';
  const airborne = barrel.phase === 'lob';
  const flight = Math.min(
    1,
    barrel.elapsedMs / attackDef.rollingBarrel!.lobDurationMs
  );
  const lift = airborne
    ? Math.sin(flight * Math.PI) * 80 + (1 - flight) * 25
    : 0;
  const phase = barrel.distanceRolled * 0.45;
  for (const direction of ['horizontal', 'vertical']) {
    const sprite = container.getChildByLabel(`barrel_${direction}`) as Sprite;
    sprite.visible = horizontal === (direction === 'horizontal');
    sprite.scale.set(
      (direction === 'horizontal' ? 78 : 94) / sprite.texture.width
    );
    sprite.y = -26 - lift;
    if (airborne) {
      sprite.rotation = flight * Math.PI * 0.8;
    } else if (horizontal) {
      sprite.rotation =
        phase * (projectile.facingDirection === 'left' ? -1 : 1);
    } else {
      // A broadside cylinder rolls around its horizontal axis, not like a wheel.
      sprite.rotation = Math.sin(phase) * 0.025;
      sprite.scale.y *= 0.95 + Math.sin(phase) * 0.05;
      sprite.y -= Math.abs(Math.sin(phase)) * 2;
    }
  }
  const shadow = container.getChildByLabel('barrel_shadow') as Graphics;
  shadow.scale.set(1 - lift / 220);
  shadow.alpha = 1 - lift / 160;
  const wake = container.getChildByLabel('barrel_wake') as Graphics;
  wake.clear();
  if (!airborne) {
    wake.rotation =
      projectile.facingDirection === 'left'
        ? Math.PI
        : projectile.facingDirection === 'up'
          ? -Math.PI / 2
          : projectile.facingDirection === 'down'
            ? Math.PI / 2
            : 0;
    for (let i = 0; i < 4; i += 1) {
      const x = -18 - i * 9;
      const y = Math.sin(phase + i * 2) * 10;
      wake.ellipse(x, y, 5 - i * 0.7, 2.5);
      wake.fill({ color: i % 2 ? 0xb9efff : 0x38bdf8, alpha: 0.75 - i * 0.12 });
    }
  }
}
