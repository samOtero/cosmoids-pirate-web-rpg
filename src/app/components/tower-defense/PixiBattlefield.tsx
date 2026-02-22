import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

interface PixiBattlefieldProps {
  engine: TowerDefenseEngine;
  onMapClick: (x: number, y: number) => void;
}

export default function PixiBattlefield({
  engine,
  onMapClick,
}: PixiBattlefieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const onMapClickRef = useRef(onMapClick);

  // Keep the latest callback without triggering re-runs of the PIXI initializer
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    let isDestroyed = false;
    let isInitialized = false;

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        preference: 'webgl',
      });

      isInitialized = true;
      if (isDestroyed) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current!.appendChild(app.canvas);

      // Add background
      await PIXI.Assets.load('/battles/bg/bg_first_island_forest_battle.png');
      if (isDestroyed) return;

      const bgSprite = PIXI.Sprite.from(
        '/battles/bg/bg_first_island_forest_battle.png'
      );
      bgSprite.width = app.screen.width;
      bgSprite.height = app.screen.height;
      app.stage.addChild(bgSprite);

      // Handle resize
      app.renderer.on('resize', () => {
        bgSprite.width = app.screen.width;
        bgSprite.height = app.screen.height;
      });

      // Interactive background for clicks
      bgSprite.eventMode = 'static';
      bgSprite.on('pointerdown', (e) => {
        const x = (e.global.x / app.screen.width) * 100;
        const y = (e.global.y / app.screen.height) * 100;
        onMapClickRef.current(x, y);
      });

      // Sprite caching structure
      const towerSprites = new Map<string, PIXI.Container>();
      const enemySprites = new Map<string, PIXI.Container>();
      const projectileSprites = new Map<string, PIXI.Graphics>();

      // PIXI's internal ticker, synced to monitor refresh rate.
      // This DOES NOT run game logic, it ONLY draws current state.
      app.ticker.add(() => {
        if (fpsRef.current) {
          fpsRef.current.innerText = `FPS: ${Math.round(app.ticker.FPS)}`;
        }

        if (!engine) return;

        const screenW = app.screen.width;
        const screenH = app.screen.height;

        // --- Render Towers ---
        const currentTowerIds = new Set(engine.towers.map((t) => t.id));
        for (const [id, sprite] of towerSprites.entries()) {
          if (!currentTowerIds.has(id)) {
            app.stage.removeChild(sprite);
            sprite.destroy({ children: true });
            towerSprites.delete(id);
          }
        }
        for (const tower of engine.towers) {
          let container = towerSprites.get(tower.id);
          if (!container) {
            container = new PIXI.Container();
            // Load and add sprite
            PIXI.Assets.load(tower.creature.spriteUrl).then((texture) => {
              if (isDestroyed || !towerSprites.has(tower.id)) return;
              const tsprite = new PIXI.Sprite(texture);
              tsprite.anchor.set(0.5);
              tsprite.width = 80;
              tsprite.height = 80;
              container!.addChildAt(tsprite, 0);
            });

            const rangeCircle = new PIXI.Graphics();
            const radius = screenW * 0.15; // 30vw approx diameter -> 15vw radius
            rangeCircle.circle(0, 0, radius);
            rangeCircle.fill({ color: 0x22d3ee, alpha: 0.05 });
            rangeCircle.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });

            container.addChild(rangeCircle);

            app.stage.addChild(container);
            towerSprites.set(tower.id, container);
          }
          container.x = (tower.position.x / 100) * screenW;
          container.y = (tower.position.y / 100) * screenH;
        }

        // --- Render Enemies ---
        const currentEnemyIds = new Set(engine.enemies.map((e) => e.id));
        for (const [id, sprite] of enemySprites.entries()) {
          if (!currentEnemyIds.has(id)) {
            app.stage.removeChild(sprite);
            sprite.destroy({ children: true });
            enemySprites.delete(id);
          }
        }
        for (const enemy of engine.enemies) {
          let container = enemySprites.get(enemy.id);
          if (!container) {
            container = new PIXI.Container();

            PIXI.Assets.load(enemy.creature.spriteUrl).then((texture) => {
              if (isDestroyed || !enemySprites.has(enemy.id)) return;
              const esprite = new PIXI.Sprite(texture);
              esprite.anchor.set(0.5);
              esprite.width = 64;
              esprite.height = 64;
              esprite.scale.x *= -1;
              container!.addChildAt(esprite, 0);
            });

            // Health bar background
            const hpBg = new PIXI.Graphics();
            hpBg.rect(-32, 32, 64, 4);
            hpBg.fill({ color: 0x000000 });

            // Health bar foreground
            const hpFg = new PIXI.Graphics();
            hpFg.rect(-32, 32, 64, 4);
            hpFg.fill({ color: 0xff0000 });

            container.addChild(hpBg);
            container.addChild(hpFg);

            app.stage.addChild(container);
            enemySprites.set(enemy.id, container);
          }
          container.x = (enemy.position.x / 100) * screenW;
          container.y = (enemy.position.y / 100) * screenH;

          // Update health bar (it is always the last child added)
          const hpFg = container.children[
            container.children.length - 1
          ] as PIXI.Graphics;
          hpFg.clear();
          hpFg.rect(-32, 32, 64 * Math.max(0, enemy.hp / enemy.maxHp), 4);
          hpFg.fill({ color: 0xff0000 });
        }

        // --- Render Projectiles ---
        const currentProjIds = new Set(engine.projectiles.map((p) => p.id));
        for (const [id, sprite] of projectileSprites.entries()) {
          if (!currentProjIds.has(id)) {
            app.stage.removeChild(sprite);
            sprite.destroy();
            projectileSprites.delete(id);
          }
        }
        for (const proj of engine.projectiles) {
          let sprite = projectileSprites.get(proj.id);
          if (!sprite) {
            sprite = new PIXI.Graphics();
            sprite.circle(0, 0, 8);
            sprite.fill({ color: 0x22d3ee });
            app.stage.addChild(sprite);
            projectileSprites.set(proj.id, sprite);
          }
          sprite.x = (proj.position.x / 100) * screenW;
          sprite.y = (proj.position.y / 100) * screenH;
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (isInitialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [engine]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />
      <div
        ref={fpsRef}
        className="absolute top-2 left-2 bg-black/60 text-green-400 font-mono font-bold px-2 py-1 text-sm rounded shadow select-none pointer-events-none z-10"
      >
        FPS: 0
      </div>
    </div>
  );
}
