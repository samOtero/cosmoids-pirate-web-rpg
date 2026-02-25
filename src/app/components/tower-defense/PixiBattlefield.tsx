import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import {
  TowerDefenseEngine,
  TD_CREATURE_DEFS,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ElementType } from '@/types/baseGame';

const TYPE_COLORS: Record<ElementType, number> = {
  [ElementType.WATER]: 0x3b82f6,
  [ElementType.FIRE]: 0xef4444,
  [ElementType.GRASS]: 0x22c55e,
  [ElementType.ELECTRIC]: 0xeab308,
  [ElementType.NORMAL]: 0xa3a3a3,
};

export const WEAKENED_THRESHOLD = 0.9;

interface PixiBattlefieldProps {
  engine: TowerDefenseEngine;
  onMapDrop: (defId: string, x: number, y: number) => void;
  onMapRemove: (defId: string) => void;
  onEnemyCaptured?: (enemyId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  getDragState?: () => 'tower' | 'capture' | false;
}

export default function PixiBattlefield({
  engine,
  onMapDrop,
  onMapRemove,
  onEnemyCaptured,
  onDragStateChange,
  getDragState,
}: PixiBattlefieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const onMapDropRef = useRef(onMapDrop);
  const onMapRemoveRef = useRef(onMapRemove);
  const onEnemyCapturedRef = useRef(onEnemyCaptured);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const getDragStateRef = useRef(getDragState);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingCaptureDeviceRef = useRef<boolean>(false);

  // Keep the latest callback without triggering re-runs of the PIXI initializer
  useEffect(() => {
    onMapDropRef.current = onMapDrop;
  }, [onMapDrop]);

  useEffect(() => {
    getDragStateRef.current = getDragState;
  }, [getDragState]);

  useEffect(() => {
    onMapRemoveRef.current = onMapRemove;
  }, [onMapRemove]);

  useEffect(() => {
    onDragStateChangeRef.current = onDragStateChange;
  }, [onDragStateChange]);

  useEffect(() => {
    onEnemyCapturedRef.current = onEnemyCaptured;
  }, [onEnemyCaptured]);

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
      await PIXI.Assets.load('/battles/bg/bg_dock_battle_pixel.png');
      if (isDestroyed) return;

      const bgSprite = PIXI.Sprite.from('/battles/bg/bg_dock_battle_pixel.png');
      bgSprite.width = app.screen.width;
      bgSprite.height = app.screen.height;
      app.stage.addChild(bgSprite);

      // Handle resize
      const updateAspectRatio = () => {
        bgSprite.width = app.screen.width;
        bgSprite.height = app.screen.height;
        if (engine && app.screen.height > 0) {
          engine.setAspectRatio(app.screen.width / app.screen.height);
        }
      };
      app.renderer.on('resize', updateAspectRatio);
      updateAspectRatio(); // Initial setting

      // Interactive background
      bgSprite.eventMode = 'static';

      // Sprite caching structure
      const towerSprites = new Map<string, PIXI.Container>();
      const enemySprites = new Map<string, PIXI.Container>();
      const projectileSprites = new Map<string, PIXI.Graphics>();
      const spotGraphics = new PIXI.Graphics();
      const invalidSpotGraphics = new PIXI.Graphics();

      let draggingNode: PIXI.Container | null = null;
      let draggingTowerCreatureId: string | null = null;

      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

      const onDragEnd = (e: PIXI.FederatedPointerEvent) => {
        if (draggingTowerCreatureId) {
          const screenW = app.screen.width;
          const screenH = app.screen.height;
          const x = (e.global.x / screenW) * 100;
          const y = (e.global.y / screenH) * 100;

          let closestSpot: { x: number; y: number } | null = null;
          let minSqDist = Infinity;
          const SNAP_DIST_SQ = 100; // 10 units squared (percentage)

          for (const spot of engine.placementSpots) {
            const dx = x - spot.x;
            const dy = y - spot.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= SNAP_DIST_SQ && distSq < minSqDist) {
              minSqDist = distSq;
              closestSpot = spot;
            }
          }

          if (closestSpot) {
            onMapDropRef.current(
              draggingTowerCreatureId,
              closestSpot.x,
              closestSpot.y
            );
          } else {
            if (onMapRemoveRef.current) {
              onMapRemoveRef.current(draggingTowerCreatureId);
            }
          }

          dragPosRef.current = null;
          if (draggingNode) draggingNode.cursor = 'grab';
          draggingNode = null;
          draggingTowerCreatureId = null;
          if (onDragStateChangeRef.current) {
            onDragStateChangeRef.current(false);
          }
        }
      };

      app.stage.on('pointerup', onDragEnd);
      app.stage.on('pointerupoutside', onDragEnd);
      app.stage.on('pointermove', (e) => {
        if (draggingNode) {
          draggingNode.x = e.global.x;
          draggingNode.y = e.global.y;

          const screenW = app.screen.width;
          const screenH = app.screen.height;
          dragPosRef.current = {
            x: (e.global.x / screenW) * 100,
            y: (e.global.y / screenH) * 100,
          };
        }
      });

      // PIXI's internal ticker, synced to monitor refresh rate.
      // This DOES NOT run game logic, it ONLY draws current state.
      app.ticker.add(() => {
        if (fpsRef.current) {
          fpsRef.current.innerText = `FPS: ${Math.round(app.ticker.FPS)}`;
        }

        if (!engine) return;

        const screenW = app.screen.width;
        const screenH = app.screen.height;

        const externalDragState = getDragStateRef.current
          ? getDragStateRef.current()
          : false;
        const isDraggingCapture =
          draggingCaptureDeviceRef.current || externalDragState === 'capture';
        const isDraggingTower =
          externalDragState === 'tower' ||
          (!isDraggingCapture && dragPosRef.current !== null) ||
          draggingTowerCreatureId !== null;

        // --- Render Towers ---
        const currentTowerKeys = new Set(
          engine.towers.map((t) => `${t.id}_${t.creatureId}`)
        );
        for (const [key, sprite] of towerSprites.entries()) {
          if (!currentTowerKeys.has(key)) {
            app.stage.removeChild(sprite);
            sprite.destroy({ children: true });
            towerSprites.delete(key);
          }
        }
        for (const tower of engine.towers) {
          const cacheKey = `${tower.id}_${tower.creatureId}`;
          let container = towerSprites.get(cacheKey);
          if (!container) {
            const newContainer = new PIXI.Container();
            container = newContainer;

            newContainer.eventMode = 'static';
            newContainer.cursor = 'grab';
            newContainer.on('pointerdown', (e) => {
              draggingNode = newContainer;
              draggingTowerCreatureId = tower.creatureId;
              newContainer.cursor = 'grabbing';
              app.stage.setChildIndex(
                newContainer,
                app.stage.children.length - 1
              );
              if (onDragStateChangeRef.current) {
                onDragStateChangeRef.current(true);
              }
            });

            const baseCreature = TD_CREATURE_DEFS[tower.speciesId].baseCreature;
            const spriteUrl =
              baseCreature.battleSpriteUrl || baseCreature.spriteUrl;
            PIXI.Assets.load(spriteUrl).then((texture) => {
              if (isDestroyed || !towerSprites.has(cacheKey)) return;
              const tsprite = new PIXI.Sprite(texture);
              tsprite.anchor.set(0.5);
              tsprite.width = 80;
              tsprite.height = 80;
              container!.addChildAt(tsprite, 0);
            });

            const rangeCircle = new PIXI.Graphics();
            rangeCircle.label = 'rangeCircle';
            const radius = screenW * 0.15; // 30vw approx diameter -> 15vw radius
            rangeCircle.circle(0, 0, radius);
            rangeCircle.fill({ color: 0x22d3ee, alpha: 0.05 });
            rangeCircle.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });

            container.addChild(rangeCircle);

            app.stage.addChild(container);
            towerSprites.set(cacheKey, container);
          }
          if (draggingTowerCreatureId !== tower.creatureId) {
            container.x = (tower.position.x / 100) * screenW;
            container.y = (tower.position.y / 100) * screenH;
          }

          const rCircle = container.getChildByLabel('rangeCircle');
          if (rCircle) {
            rCircle.visible = draggingTowerCreatureId === tower.creatureId;
          }
        }

        // --- Render Placement Spots & Capture Hover ---
        spotGraphics.clear();
        invalidSpotGraphics.clear();

        app.stage.addChild(spotGraphics); // Ensure it's on the stage
        app.stage.addChild(invalidSpotGraphics);
        app.stage.setChildIndex(spotGraphics, app.stage.children.length - 2);
        app.stage.setChildIndex(
          invalidSpotGraphics,
          app.stage.children.length - 1
        );

        let isHoveringValidSpot = false;

        if (isDraggingCapture) {
          // Capture Device Logic
          let targetedEnemyId: string | null = null;
          let isWeakened = false;

          if (dragPosRef.current) {
            let minSqDist = Infinity;
            const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

            // Find closest enemy
            engine.enemies.forEach((enemy) => {
              const dx = dragPosRef.current!.x - enemy.position.x;
              const dy = dragPosRef.current!.y - enemy.position.y;
              const distSq = dx * dx + dy * dy;

              if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
                minSqDist = distSq;
                targetedEnemyId = enemy.id;
                isWeakened = enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
              }
            });

            if (targetedEnemyId) {
              isHoveringValidSpot = isWeakened;
              const enemy = engine.enemies.find(
                (e) => e.id === targetedEnemyId
              )!;
              const pxX = (enemy.position.x / 100) * screenW;
              const pxY = (enemy.position.y / 100) * screenH;
              const radius = screenW * 0.05;

              if (isWeakened) {
                // Green circle for valid capture
                spotGraphics.circle(pxX, pxY, radius);
                spotGraphics.fill({ color: 0x22c55e, alpha: 0.3 }); // Transparent green
                spotGraphics.stroke({
                  color: 0x22c55e,
                  alpha: 1,
                  width: 4,
                });
              } else {
                // Red X for invalid capture (not weakened enough)
                invalidSpotGraphics.circle(pxX, pxY, radius);
                invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 });
                invalidSpotGraphics.stroke({
                  color: 0xef4444,
                  alpha: 0.8,
                  width: 3,
                });

                const crossSize = radius * 0.5;
                invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
                invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
                invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
                invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
                invalidSpotGraphics.stroke({
                  color: 0xef4444,
                  width: 4,
                  join: 'round',
                  cap: 'round',
                });
              }
            }
          }
        } else if (isDraggingTower) {
          // Normal Tower Placement Logic
          if (draggingTowerCreatureId === null && dragPosRef.current) {
            const pxX = (dragPosRef.current.x / 100) * screenW;
            const pxY = (dragPosRef.current.y / 100) * screenH;
            const radius = screenW * 0.15;
            spotGraphics.circle(pxX, pxY, radius);
            spotGraphics.fill({ color: 0x22d3ee, alpha: 0.05 });
            spotGraphics.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });
          }

          engine.placementSpots.forEach((spot) => {
            const pxX = (spot.x / 100) * screenW;
            const pxY = (spot.y / 100) * screenH;

            let isHovered = false;

            if (dragPosRef.current) {
              const dx = dragPosRef.current.x - spot.x;
              const dy = dragPosRef.current.y - spot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= 10) {
                // Hover/Snap threshold is 10vw/vh approx
                isHovered = true;
                isHoveringValidSpot = true;
              }
            }

            const strokeWidth = isHovered ? 4 : 2;
            const alpha = isHovered ? 1 : 0.8;
            let baseColor = 0xf97316; // Orange

            if (engine.isSpotOccupied(spot.x, spot.y)) {
              // Let's color occupied spots differently while dragging to indicate swap!
              // blue-ish if occupied! Wait, let's keep it orange to stay consistent but it proves it works.
              baseColor = 0xf97316;
            }

            if (isHovered) {
              spotGraphics.circle(pxX, pxY, screenW * 0.05); // 5vw radius
              spotGraphics.fill({ color: baseColor, alpha: 0.3 }); // Transparent
              spotGraphics.stroke({
                color: baseColor,
                alpha: alpha,
                width: strokeWidth,
              }); // Solid thicker border
            } else {
              spotGraphics.circle(pxX, pxY, screenW * 0.05);
              spotGraphics.stroke({
                color: baseColor,
                alpha: alpha,
                width: strokeWidth,
              }); // Standard outline
            }
          });

          // If dragging tower but not hovering a valid open spot, show error indicator
          if (
            dragPosRef.current &&
            !isHoveringValidSpot &&
            dragPosRef.current
          ) {
            const pxX = (dragPosRef.current.x / 100) * screenW;
            const pxY = (dragPosRef.current.y / 100) * screenH;
            const radius = screenW * 0.05;

            invalidSpotGraphics.circle(pxX, pxY, radius);
            invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 }); // Transparent red
            invalidSpotGraphics.stroke({
              color: 0xef4444,
              alpha: 0.8,
              width: 3,
            }); // Solid red border

            // Draw an X
            const crossSize = radius * 0.5;
            invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
            invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
            invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
            invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
            invalidSpotGraphics.stroke({
              color: 0xef4444,
              width: 4,
              join: 'round',
              cap: 'round',
            });
          }
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

            const baseCreature =
              TD_CREATURE_DEFS[enemy.definitionId].baseCreature;
            const spriteUrl =
              baseCreature.battleSpriteUrl || baseCreature.spriteUrl;
            PIXI.Assets.load(spriteUrl).then((texture) => {
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
            hpBg.rect(-33, -41, 66, 6);
            hpBg.fill({ color: 0x000000 });
            hpBg.stroke({ color: 0x111111, width: 1 });

            // Health bar foreground
            const hpFg = new PIXI.Graphics();
            hpFg.rect(-32, -40, 64, 4);
            hpFg.fill({ color: 0x22c55e });

            container.addChild(hpBg);
            container.addChild(hpFg);

            app.stage.addChild(container);
            enemySprites.set(enemy.id, container);
          }
          container.x = (enemy.position.x / 100) * screenW;
          container.y = (enemy.position.y / 100) * screenH;

          // Update health bar (it is always the last child added)
          const hpRatio = enemy.hp / enemy.maxHp;
          const hpFg = container.children[
            container.children.length - 1
          ] as PIXI.Graphics;
          hpFg.clear();
          hpFg.rect(-32, -40, 64 * Math.max(0, hpRatio), 4);

          const isEnemyWeakened = hpRatio <= WEAKENED_THRESHOLD;
          hpFg.fill({ color: isEnemyWeakened ? 0xff0000 : 0x22c55e });
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

            let projColor = 0x22d3ee; // Default cyan
            if (proj.attackDefinitionId) {
              const def = ATTACK_DEFS[proj.attackDefinitionId];
              if (def) {
                projColor = TYPE_COLORS[def.type] || projColor;
              }
            }

            sprite.fill({ color: projColor });
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
    <div
      className="flex-1 relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';

        // Set dragging capture device ref based on items (types in modern browsers)
        if (e.dataTransfer.types.includes('application/capture-device')) {
          draggingCaptureDeviceRef.current = true;
        } else {
          draggingCaptureDeviceRef.current = false;
        }

        // Track hover position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        dragPosRef.current = { x, y };
      }}
      onDragLeave={() => {
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;

        const towerIdStr = e.dataTransfer.getData('application/tower-id');
        const isCaptureDevice = e.dataTransfer.getData(
          'application/capture-device'
        );

        if (isCaptureDevice && engine) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          let targetedEnemyId: string | null = null;
          let isWeakened = false;
          let minSqDist = Infinity;
          const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

          engine.enemies.forEach((enemy) => {
            const dx = x - enemy.position.x;
            const dy = y - enemy.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
              minSqDist = distSq;
              targetedEnemyId = enemy.id;
              isWeakened = enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
            }
          });

          if (targetedEnemyId && isWeakened) {
            if (onEnemyCapturedRef.current) {
              onEnemyCapturedRef.current(targetedEnemyId);
            }
          }
          return;
        }

        if (towerIdStr) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          if (engine) {
            let closestSpot: { x: number; y: number } | null = null;
            let minSqDist = Infinity;
            const SNAP_DIST_SQ = 100; // 10 units squared

            for (const spot of engine.placementSpots) {
              const dx = x - spot.x;
              const dy = y - spot.y;
              const distSq = dx * dx + dy * dy;

              if (distSq <= SNAP_DIST_SQ && distSq < minSqDist) {
                minSqDist = distSq;
                closestSpot = spot;
              }
            }

            if (closestSpot) {
              onMapDropRef.current(towerIdStr, closestSpot.x, closestSpot.y);
            } else {
              if (onMapRemoveRef.current) {
                onMapRemoveRef.current(towerIdStr);
              }
            }
          }
        }
      }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <div
        ref={fpsRef}
        className="absolute top-2 left-2 bg-black/60 text-green-400 font-mono font-bold px-2 py-1 text-sm rounded shadow select-none pointer-events-none z-10"
      >
        FPS: 0
      </div>
    </div>
  );
}
