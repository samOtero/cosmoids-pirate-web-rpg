import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as PIXI from 'pixi.js';
import {
  TowerDefenseEngine,
  TD_CREATURE_DEFS,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ElementType } from '@/types/baseGame';
import { TD_BASE_HEIGHT } from '@/constants/game';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { BaseTDUnit } from '@/engine/tower-defense/types';
import { interpolateKeyframes } from '@/utils/animationUtils';

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

  const bScale = tdConfig.scale ?? 1;
  const flipX = tdConfig.flipX ?? false;
  sprite.scale.x = flipX ? -bScale : bScale;
  sprite.scale.y = tdConfig.flipY ? -bScale : bScale;

  const sOffsetX = tdConfig.offsetX ?? 0;
  const sOffsetY = tdConfig.offsetY ?? 0;
  sprite.x = sOffsetX;
  sprite.y = sOffsetY;

  const spriteUrl = tdConfig.url || fallbackUrl;
  if (spriteUrl && (sprite as any).currentUrl !== spriteUrl) {
    (sprite as any).currentUrl = spriteUrl;
    PIXI.Assets.load(spriteUrl).then((t) => {
      if (onImageLoaded) onImageLoaded(t);
    });
  }

  const shadowScaleX = tdConfig.shadowScaleX ?? 1;
  const shadowScaleY = tdConfig.shadowScaleY ?? 1;
  const shadowOffsetX = tdConfig.shadowOffsetX ?? 0;
  const shadowOffsetY = tdConfig.shadowOffsetY ?? 0;

  shadow.clear();
  shadow.ellipse(
    0 + shadowOffsetX,
    30 * bScale + shadowOffsetY,
    25 * shadowScaleX,
    12 * shadowScaleY
  );
  shadow.fill({ color: 0x000000, alpha: 0.4 });
  shadow.scale.x = flipX ? -1 : 1;

  if ((unit.damageFlashTimerMs || 0) > 0) {
    sprite.tint = 0xffffff;

    // Copy existing filters or start fresh
    const currentFilters = Array.isArray(sprite.filters)
      ? [...sprite.filters]
      : sprite.filters
        ? [sprite.filters]
        : [];

    let flashFilter = currentFilters.find(
      (f: any) => f.__isDamageFlash
    ) as PIXI.ColorMatrixFilter;
    if (!flashFilter) {
      flashFilter = new PIXI.ColorMatrixFilter();
      (flashFilter as any).__isDamageFlash = true;
      currentFilters.push(flashFilter);
      sprite.filters = currentFilters; // Re-assign instead of mutating
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
      const newFilters = currentFilters.filter((f: any) => !f.__isDamageFlash);
      sprite.filters = newFilters.length > 0 ? newFilters : [];
    }
  }
}

export const WEAKENED_THRESHOLD = 0.9;

export function renderHealthBar(
  unit: BaseTDUnit,
  container: PIXI.Container,
  configId: string,
  hideWhenFull: boolean = false
) {
  const tdConfigMap = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40; // Default offset

  let hpBg = container.getChildByLabel('hpBg') as PIXI.Graphics | undefined;
  let hpFg = container.getChildByLabel('hpFg') as PIXI.Graphics | undefined;

  if (!hpBg || !hpFg) {
    hpBg = new PIXI.Graphics();
    hpBg.label = 'hpBg';
    container.addChild(hpBg);

    hpFg = new PIXI.Graphics();
    hpFg.label = 'hpFg';
    container.addChild(hpFg);
  }

  // Draw background
  hpBg.clear();
  hpBg.rect(-33, hpOffsetY - 1, 66, 6);
  hpBg.fill({ color: 0x000000 });
  hpBg.stroke({ color: 0x111111, width: 1 });

  // Draw foreground
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const isWeakened = unit.isShiny || hpRatio <= WEAKENED_THRESHOLD;
  const isUncapturable = (unit as any).uncapturable;

  if (hideWhenFull && hpRatio >= 1 && !unit.isShiny) {
    hpBg.visible = false;
    hpFg.visible = false;
  } else {
    hpBg.visible = true;
    hpFg.visible = true;
    hpFg.clear();
    hpFg.rect(-32, hpOffsetY, 64 * Math.max(0, hpRatio), 4);
    if (isUncapturable) {
      hpFg.fill({ color: 0x3b82f6 }); // Blue
    } else {
      hpFg.fill({ color: isWeakened ? 0xff0000 : 0x22c55e });
    }
  }
}

function drawStar(g: PIXI.Graphics, size: number) {
  g.clear();
  g.moveTo(0, -size);
  g.quadraticCurveTo(0, 0, size, 0);
  g.quadraticCurveTo(0, 0, 0, size);
  g.quadraticCurveTo(0, 0, -size, 0);
  g.quadraticCurveTo(0, 0, 0, -size);
  const colors = [0xffeb3b, 0xffffff, 0xffd54f, 0x80deea, 0xf48fb1];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  g.fill({ color: randomColor });
}

function updateSparkles(container: PIXI.Container, unit: BaseTDUnit, delta: number) {
  let sparkleContainer = container.getChildByLabel('sparkles') as PIXI.Container | undefined;
  if (unit.isShiny) {
    if (!sparkleContainer) {
      sparkleContainer = new PIXI.Container();
      sparkleContainer.label = 'sparkles';
      container.addChild(sparkleContainer);
    }

    // Update existing sparkles
    const children = [...sparkleContainer.children] as PIXI.Graphics[];
    children.forEach((child: any) => {
      child.life -= delta;
      if (child.life <= 0) {
        sparkleContainer!.removeChild(child);
        child.destroy();
      } else {
        child.x += child.vx * delta;
        child.y += child.vy * delta;
        child.rotation += child.vRot * delta;

        const lifeRatio = child.life / child.maxLife;
        child.alpha = Math.min(1, lifeRatio * 1.5);
        child.scale.set(Math.min(1, lifeRatio * 1.5) * child.baseScale);
      }
    });

    // Spawn new sparkles if needed
    if (sparkleContainer.children.length < 6 && Math.random() < 0.15) {
      const star = new PIXI.Graphics();
      const size = 3 + Math.random() * 5;
      drawStar(star, size);

      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius - 10; // offset slightly upward

      const speed = 0.2 + Math.random() * 0.3;
      (star as any).vx = Math.cos(angle) * speed;
      (star as any).vy = Math.sin(angle) * speed - 0.1; // slight upward drift
      (star as any).vRot = (Math.random() - 0.5) * 0.05;
      (star as any).maxLife = 30 + Math.random() * 30;
      (star as any).life = (star as any).maxLife;
      (star as any).baseScale = 0.6 + Math.random() * 0.4;

      sparkleContainer.addChild(star);
    }
  } else {
    if (sparkleContainer) {
      container.removeChild(sparkleContainer);
      sparkleContainer.destroy({ children: true });
    }
  }
}

const TYPE_COLORS: Record<ElementType, number> = {
  [ElementType.WATER]: 0x3b82f6,
  [ElementType.FIRE]: 0xef4444,
  [ElementType.GRASS]: 0x22c55e,
  [ElementType.POISON]: 0xa855f7,
  [ElementType.ELECTRIC]: 0xeab308,
  [ElementType.NORMAL]: 0xa3a3a3,
  [ElementType.FLYING]: 0x3b82f6,
};

interface PixiBattlefieldProps {
  engine: TowerDefenseEngine;
  onMapDrop: (defId: string, x: number, y: number) => void;
  onMapRemove: (defId: string) => void;
  onEnemyCaptured?: (enemyId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  getDragState?: () => 'tower' | 'capture' | false;
  backgroundUrl?: string;
  backgroundScale?: number;
}

export interface PixiBattlefieldRef {
  handleExternalMove: (
    clientX: number,
    clientY: number,
    type: 'tower' | 'capture'
  ) => void;
  handleExternalLeave: () => void;
  handleExternalDrop: (
    clientX: number,
    clientY: number,
    towerIdStr: string | null,
    isCaptureDevice: boolean
  ) => void;
}

const PixiBattlefield = forwardRef<PixiBattlefieldRef, PixiBattlefieldProps>(
  (
    {
      engine,
      onMapDrop,
      onMapRemove,
      onEnemyCaptured,
      onDragStateChange,
      getDragState,
      backgroundUrl,
      backgroundScale = 1,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fpsRef = useRef<HTMLDivElement>(null);
    const onMapDropRef = useRef(onMapDrop);
    const onMapRemoveRef = useRef(onMapRemove);
    const onEnemyCapturedRef = useRef(onEnemyCaptured);
    const onDragStateChangeRef = useRef(onDragStateChange);
    const getDragStateRef = useRef(getDragState);
    const dragPosRef = useRef<{ x: number; y: number } | null>(null);
    const draggingCaptureDeviceRef = useRef<boolean>(false);
    const bgBoundsRef = useRef<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>({ x: 0, y: 0, width: 0, height: 0 });
    const scrollRef = useRef({ x: 0, y: 0 });
    const isScrollDraggingRef = useRef(false);
    const scrollDragStartRef = useRef<{
      x: number;
      y: number;
      scrollX: number;
      scrollY: number;
    } | null>(null);
    const zoomRef = useRef(1); // 1 = normal (max zoom in), < 1 = zoomed out

    useImperativeHandle(ref, () => ({
      handleExternalMove: (clientX, clientY, type) => {
        draggingCaptureDeviceRef.current = type === 'capture';
        const bgBounds = bgBoundsRef.current;
        if (bgBounds && bgBounds.width > 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const localX = clientX - rect.left - bgBounds.x;
          const localY = clientY - rect.top - bgBounds.y;
          const x = (localX / bgBounds.width) * 100;
          const y = (localY / bgBounds.height) * 100;
          dragPosRef.current = { x, y };
        }
      },
      handleExternalLeave: () => {
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;
      },
      handleExternalDrop: (clientX, clientY, towerIdStr, isCaptureDevice) => {
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;

        const bgBounds = bgBoundsRef.current;
        if (!bgBounds || bgBounds.width === 0 || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const localX = clientX - rect.left - bgBounds.x;
        const localY = clientY - rect.top - bgBounds.y;
        const x = (localX / bgBounds.width) * 100;
        const y = (localY / bgBounds.height) * 100;

        if (isCaptureDevice && engine) {
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
              isWeakened = enemy.isShiny || enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
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
      },
    }));

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
      let bgBounds = { x: 0, y: 0, width: 0, height: 0 };

      const initPixi = async () => {
        await app.init({
          resizeTo: containerRef.current!,
          backgroundAlpha: 0,
          preference: 'webgl',
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        isInitialized = true;
        if (isDestroyed) {
          app.destroy(true, { children: true });
          return;
        }

        containerRef.current!.appendChild(app.canvas);

        // Add background
        const bgUrl = backgroundUrl || '/battles/bg/bg_dock_battle_td.png';
        const scale = backgroundScale > 1 ? backgroundScale : 1;
        await PIXI.Assets.load(bgUrl);
        if (isDestroyed) return;

        const bgSprite = PIXI.Sprite.from(bgUrl);
        app.stage.addChild(bgSprite);

        // Full (unscrolled) background dimensions — used to derive scroll limits
        let fullBgHeight = 0;
        let fullBgWidth = 0;

        // Handle resize + zoom — called each tick to pick up zoom changes
        const updateBgLayout = () => {
          if (
            bgSprite.texture.width > 0 &&
            bgSprite.texture.height > 0 &&
            app.screen.height > 0
          ) {
            const ratio = bgSprite.texture.width / bgSprite.texture.height;
            const zoom = zoomRef.current;
            fullBgHeight = app.screen.height * scale;
            fullBgWidth = fullBgHeight * ratio;

            // Display dimensions = world dims * zoom
            const displayH = fullBgHeight * zoom;
            const displayW = fullBgWidth * zoom;
            bgSprite.height = displayH;
            bgSprite.width = displayW;

            // Clamp scroll (in pixel space)
            const maxScrollY = Math.max(0, displayH - app.screen.height);
            const maxScrollX = Math.max(0, displayW - app.screen.width);
            scrollRef.current.y = Math.min(scrollRef.current.y, maxScrollY);
            scrollRef.current.x = Math.min(scrollRef.current.x, maxScrollX);
            bgSprite.x =
              (app.screen.width - displayW) / 2 - scrollRef.current.x;
            bgSprite.y = -scrollRef.current.y;

            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: displayW,
              height: displayH,
            };
            bgBoundsRef.current = bgBounds;
            if (engine) {
              engine.setAspectRatio(ratio);
            }
          }
        };
        app.renderer.on('resize', updateBgLayout);
        updateBgLayout(); // Initial setting

        // Interactive background
        bgSprite.eventMode = 'static';

        // --- Scroll drag on background ---
        if (scale > 1) {
          bgSprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            // Only start scroll if not dragging a tower or capture device
            if (draggingTowerCreatureId || getDragStateRef.current?.()) return;
            isScrollDraggingRef.current = true;
            scrollDragStartRef.current = {
              x: e.global.x,
              y: e.global.y,
              scrollX: scrollRef.current.x,
              scrollY: scrollRef.current.y,
            };
          });
        }

        // Sprite caching structure
        const towerSprites = new Map<string, PIXI.Container>();
        const enemySprites = new Map<string, PIXI.Container>();
        const environmentUnitSprites = new Map<string, PIXI.Container>();
        const captureUnitSprites = new Map<string, PIXI.Container>();
        const projectileSprites = new Map<string, PIXI.Container>();
        const vfxSprites = new Map<string, PIXI.Container>();
        const floatingTextSprites = new Map<string, PIXI.Text>();
        const spotGraphics = new PIXI.Graphics();
        const invalidSpotGraphics = new PIXI.Graphics();

        let draggingNode: PIXI.Container | null = null;
        let draggingTowerCreatureId: string | null = null;

        app.stage.eventMode = 'static';
        app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

        const onDragEnd = (e: PIXI.FederatedPointerEvent) => {
          if (draggingTowerCreatureId && bgBounds.width > 0) {
            const x = ((e.global.x - bgBounds.x) / bgBounds.width) * 100;
            const y = ((e.global.y - bgBounds.y) / bgBounds.height) * 100;

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
          // Handle scroll dragging
          if (
            isScrollDraggingRef.current &&
            scrollDragStartRef.current &&
            scale > 1
          ) {
            const dx = scrollDragStartRef.current.x - e.global.x;
            const dy = scrollDragStartRef.current.y - e.global.y;
            const maxScrollY = Math.max(0, fullBgHeight - app.screen.height);
            const maxScrollX = Math.max(0, fullBgWidth - app.screen.width);
            scrollRef.current.y = Math.max(
              0,
              Math.min(maxScrollY, scrollDragStartRef.current.scrollY + dy)
            );
            scrollRef.current.x = Math.max(
              0,
              Math.min(maxScrollX, scrollDragStartRef.current.scrollX + dx)
            );
            bgSprite.x =
              (app.screen.width - bgSprite.width) / 2 - scrollRef.current.x;
            bgSprite.y = -scrollRef.current.y;
            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: bgSprite.width,
              height: bgSprite.height,
            };
            bgBoundsRef.current = bgBounds;
          }

          if (draggingNode && bgBounds.width > 0) {
            draggingNode.x = e.global.x;
            draggingNode.y = e.global.y;

            dragPosRef.current = {
              x: ((e.global.x - bgBounds.x) / bgBounds.width) * 100,
              y: ((e.global.y - bgBounds.y) / bgBounds.height) * 100,
            };
          }
        });

        // Stop scroll dragging on pointer up
        app.stage.on('pointerup', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });
        app.stage.on('pointerupoutside', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });

        // PIXI's internal ticker, synced to monitor refresh rate.
        // This DOES NOT run game logic, it ONLY draws current state.
        app.ticker.add(() => {
          // Re-evaluate bg layout each tick to pick up zoom changes
          updateBgLayout();

          if (fpsRef.current) {
            fpsRef.current.innerText = `FPS: ${Math.round(app.ticker.FPS)}`;
          }

          if (!engine || bgBounds.width === 0) return;

          const zoom = zoomRef.current;
          const screenW = bgBounds.width;
          const screenH = bgBounds.height;
          const offsetX = bgBounds.x;
          const offsetY = bgBounds.y;
          const viewportH = app.screen.height; // For sizing UI elements (not affected by bg scale)

          const externalDragState = getDragStateRef.current
            ? getDragStateRef.current()
            : false;
          const isDraggingCapture =
            draggingCaptureDeviceRef.current || externalDragState === 'capture';
          const isDraggingTower =
            externalDragState === 'tower' ||
            (!isDraggingCapture && dragPosRef.current !== null) ||
            draggingTowerCreatureId !== null;

          // --- Render Environment Units ---
          const currentEnvUnitIds = new Set(
            engine.environmentUnits.map((e) => e.id)
          );
          for (const [id, sprite] of environmentUnitSprites.entries()) {
            if (!currentEnvUnitIds.has(id)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              environmentUnitSprites.delete(id);
            }
          }

          for (const envUnit of engine.environmentUnits) {
            let container = environmentUnitSprites.get(envUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'env_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              app.stage.addChild(container);
              app.stage.setChildIndex(container, 1); // just above background

              environmentUnitSprites.set(envUnit.id, container);
            }

            container.x = offsetX + (envUnit.position.x / 100) * screenW;
            container.y = offsetY + (envUnit.position.y / 100) * screenH;

            // Calculate responsive scale based on the editor's 80x80 box matching 5vh placement spots
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;

            container.scale.set(finalScale);

            const sprite = container.getChildByLabel('env_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (sprite && shadow) {
              applyTDUnitTransforms(
                envUnit,
                sprite,
                shadow,
                envUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                }
              );
            }
            renderHealthBar(
              envUnit,
              container,
              envUnit.tdConfigId,
              true /* hideWhenFull */
            );
          }

          // --- Render Capture Units ---
          const currentCaptureUnitIds = new Set(
            engine.captureUnits.map((c) => c.id)
          );
          for (const [id, sprite] of captureUnitSprites.entries()) {
            if (!currentCaptureUnitIds.has(id)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              captureUnitSprites.delete(id);
            }
          }

          for (const capUnit of engine.captureUnits) {
            let container = captureUnitSprites.get(capUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive initially

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'cap_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              app.stage.addChild(container);
              app.stage.setChildIndex(container, 1); // just above background

              captureUnitSprites.set(capUnit.id, container);
            }

            // If held, maybe offset slightly so it looks carried,
            // or just render it at the enemy position (with a small Y offset)
            const heldOffset = capUnit.heldByEnemyId ? screenH * -0.02 : 0;

            container.x = offsetX + (capUnit.position.x / 100) * screenW;
            container.y =
              offsetY + (capUnit.position.y / 100) * screenH + heldOffset;

            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            // Make it render above the enemy if held (enemy might be index 1 or so, we'll just push to top)
            if (capUnit.heldByEnemyId) {
              app.stage.setChildIndex(container, app.stage.children.length - 1);
            }

            const sprite = container.getChildByLabel('cap_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (sprite && shadow) {
              // Hide shadow if held
              shadow.visible = !capUnit.heldByEnemyId;

              applyTDUnitTransforms(
                capUnit,
                sprite,
                shadow,
                capUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                }
              );
            }
            renderHealthBar(
              capUnit,
              container,
              capUnit.tdConfigId,
              true /* hideWhenFull */
            );
          }

          // --- Render Towers ---
          const currentTowerKeys = new Set(
            engine.towers.map((t) => `${t.id}_${t.creature.id}`)
          );
          for (const [key, sprite] of towerSprites.entries()) {
            if (!currentTowerKeys.has(key)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              towerSprites.delete(key);
            }
          }
          for (const tower of engine.towers) {
            const cacheKey = `${tower.id}_${tower.creature.id}`;
            let container = towerSprites.get(cacheKey);
            if (!container) {
              const newContainer = new PIXI.Container();
              container = newContainer;

              newContainer.eventMode = 'static';
              newContainer.cursor = 'grab';
              newContainer.on('pointerdown', (e) => {
                draggingNode = newContainer;
                draggingTowerCreatureId = tower.creature.id;
                newContainer.cursor = 'grabbing';
                app.stage.setChildIndex(
                  newContainer,
                  app.stage.children.length - 1
                );
                if (onDragStateChangeRef.current) {
                  onDragStateChangeRef.current(true);
                }
              });

              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const tsprite = new PIXI.Sprite();
              tsprite.label = 'tower_sprite';
              tsprite.anchor.set(0.5);
              container.addChildAt(tsprite, 1);

              const rangeCircle = new PIXI.Graphics();
              rangeCircle.label = 'rangeCircle';
              const radius = TD_BASE_HEIGHT * 0.4; // dynamically scales to viewportH * 0.4
              rangeCircle.circle(0, 0, radius);
              rangeCircle.fill({ color: 0x22d3ee, alpha: 0.05 });
              rangeCircle.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });

              container.addChild(rangeCircle);

              app.stage.addChild(container);
              towerSprites.set(cacheKey, container);
            }
            if (draggingTowerCreatureId !== tower.creature.id) {
              container.x = offsetX + (tower.position.x / 100) * screenW;
              container.y = offsetY + (tower.position.y / 100) * screenH;
              const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
              const finalScale = zoom * responsiveScale;
              container.scale.set(finalScale);
            }

            const rCircle = container.getChildByLabel('rangeCircle');
            if (rCircle) {
              rCircle.visible = draggingTowerCreatureId === tower.creature.id;
            }

            const tsprite = container.getChildByLabel('tower_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (tsprite && shadow) {
              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;
              applyTDUnitTransforms(
                tower,
                tsprite,
                shadow,
                tower.creature.speciesId,
                baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                (t) => {
                  if (!isDestroyed) tsprite.texture = t;
                }
              );

              // Fade tower if it's currently performing a Tackle attack
              const isTackling = engine.projectiles.some(
                (p) =>
                  p.sourceId === tower.id && p.attackDefinitionId === 'TACKLE'
              );
              tsprite.alpha = isTackling ? 0 : 1;
              shadow.alpha = isTackling ? 0 : 1;
            }
            renderHealthBar(
              tower,
              container,
              tower.creature.speciesId,
              true /* hideWhenFull */
            );
            updateSparkles(container, tower, app.ticker.deltaTime);

            const hpBg = container.getChildByLabel('hpBg') as
              | PIXI.Graphics
              | undefined;
            const hpFg = container.getChildByLabel('hpFg') as
              | PIXI.Graphics
              | undefined;
            // Check if tower is currently doing a Dash Attack
            // It disappears if any of its active projectiles are dash attacks
            const isDashing = engine.projectiles.some((p) => {
              if (p.sourceId !== tower.id || !p.attackDefinitionId)
                return false;
              const def = ATTACK_DEFS[p.attackDefinitionId];
              return def && def.isDashAttack;
            });

            if (isDashing) {
              container.alpha = 0;
            } else {
              container.alpha = 1;
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
                  isWeakened = enemy.isShiny || enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
                }
              });

              if (targetedEnemyId) {
                const enemy = engine.enemies.find(
                  (e) => e.id === targetedEnemyId
                )!;
                const isValidCapture = isWeakened && !enemy.uncapturable;

                isHoveringValidSpot = isValidCapture;

                const pxX = offsetX + (enemy.position.x / 100) * screenW;
                const pxY = offsetY + (enemy.position.y / 100) * screenH;
                const radius = viewportH * 0.05 * zoom;

                if (isValidCapture) {
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
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const radius = viewportH * 0.15 * zoom;
              spotGraphics.circle(pxX, pxY, radius);
              spotGraphics.fill({ color: 0x22d3ee, alpha: 0.05 });
              spotGraphics.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });
            }

            engine.placementSpots.forEach((spot) => {
              const pxX = offsetX + (spot.x / 100) * screenW;
              const pxY = offsetY + (spot.y / 100) * screenH;

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
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom); // 5vh radius
                spotGraphics.fill({ color: baseColor, alpha: 0.3 }); // Transparent
                spotGraphics.stroke({
                  color: baseColor,
                  alpha: alpha,
                  width: strokeWidth,
                }); // Solid thicker border
              } else {
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom);
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
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const radius = viewportH * 0.05 * zoom;

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

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const esprite = new PIXI.Sprite();
              esprite.label = 'enemy_sprite';
              esprite.anchor.set(0.5);
              container.addChildAt(esprite, 1);

              app.stage.addChild(container);
              enemySprites.set(enemy.id, container);
            }
            container.x = offsetX + (enemy.position.x / 100) * screenW;
            container.y = offsetY + (enemy.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            const esprite = container.getChildByLabel('enemy_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (esprite && shadow) {
              const baseCreature =
                TD_CREATURE_DEFS[enemy.definitionId].baseCreature;
              applyTDUnitTransforms(
                enemy,
                esprite,
                shadow,
                enemy.definitionId,
                baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                (t) => {
                  if (!isDestroyed) esprite.texture = t;
                }
              );
            }

            renderHealthBar(enemy, container, enemy.definitionId);
            updateSparkles(container, enemy, app.ticker.deltaTime);
          }

          // --- Render Projectiles ---
          const currentProjIds = new Set(engine.projectiles.map((p) => p.id));
          for (const [id, container] of projectileSprites.entries()) {
            if (!currentProjIds.has(id)) {
              app.stage.removeChild(container);
              container.destroy({ children: true });
              projectileSprites.delete(id);
            }
          }
          for (const proj of engine.projectiles) {
            let container = projectileSprites.get(proj.id);
            if (!container) {
              container = new PIXI.Container();

              const def = proj.attackDefinitionId
                ? ATTACK_DEFS[proj.attackDefinitionId]
                : undefined;

              if (def && def.isDashAttack) {
                const shadow = new PIXI.Graphics();
                shadow.label = 'shadow';
                container.addChild(shadow);

                const psprite = new PIXI.Sprite();
                psprite.label = 'proj_sprite';
                psprite.anchor.set(0.5);
                container.addChild(psprite);
              } else {
                const g = new PIXI.Graphics();
                g.label = 'proj_graphics';
                g.circle(0, 0, 8);

                let projColor = 0x22d3ee; // Default cyan
                if (proj.attackDefinitionId) {
                  const def = ATTACK_DEFS[proj.attackDefinitionId];
                  if (def) {
                    projColor = TYPE_COLORS[def.type] || projColor;
                  }
                }

                g.fill({ color: projColor });
                container.addChild(g);
              }

              app.stage.addChild(container);
              projectileSprites.set(proj.id, container);
            }

            container.x = offsetX + (proj.position.x / 100) * screenW;
            container.y = offsetY + (proj.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            const def = proj.attackDefinitionId
              ? ATTACK_DEFS[proj.attackDefinitionId]
              : undefined;

            if (def && def.isDashAttack) {
              const psprite = container.getChildByLabel('proj_sprite') as
                | PIXI.Sprite
                | undefined;
              const shadow = container.getChildByLabel('shadow') as
                | PIXI.Graphics
                | undefined;
              if (psprite && shadow) {
                const sourceTower = engine.towers.find(
                  (t) => t.id === proj.sourceId
                );
                if (sourceTower) {
                  const baseCreature =
                    TD_CREATURE_DEFS[sourceTower.creature.speciesId]
                      .baseCreature;
                  applyTDUnitTransforms(
                    {
                      ...proj,
                      hp: 1,
                      maxHp: 1,
                      facingDirection: proj.facingDirection || 'down',
                    } as BaseTDUnit,
                    psprite,
                    shadow,
                    sourceTower.creature.speciesId,
                    baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                    (t) => {
                      if (!isDestroyed) psprite.texture = t;
                    }
                  );
                  shadow.visible = false; // Keep shadow hidden
                }
              }
            }
          }

          // --- Render Visual Effects ---
          const currentVfxIds = new Set(engine.visualEffects.map((v) => v.id));
          for (const [id, container] of vfxSprites.entries()) {
            if (!currentVfxIds.has(id)) {
              app.stage.removeChild(container);
              container.destroy({ children: true });
              vfxSprites.delete(id);
            }
          }
          for (const vfx of engine.visualEffects) {
            const existingContainer = vfxSprites.get(vfx.id);
            const container = existingContainer || new PIXI.Container();

            // Fetch the visual effect configuration
            const tdConfigMap = CREATURE_TD_CONFIGS[vfx.configId] || {
              default: { scale: 1 },
            };
            const tdConfig =
              tdConfigMap[vfx.facingDirection || 'default'] ||
              tdConfigMap.default;
            const animConfig = tdConfig.vfxAnimation;

            if (!existingContainer) {
              if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
                animConfig.layers?.forEach((layer, layerIdx) => {
                  const sprite = new PIXI.Sprite();
                  sprite.label = `vfx_layer_${layerIdx}`;
                  sprite.anchor.set(0.5);
                  container.addChild(sprite);

                  PIXI.Assets.load(layer.url).then((t) => {
                    if (!isDestroyed) sprite.texture = t;
                  });
                });
              } else {
                const sprite = new PIXI.Sprite();
                sprite.label = 'vfx_sprite';
                sprite.anchor.set(0.5);
                container.addChild(sprite);

                const mask = new PIXI.Graphics();
                mask.label = 'vfx_mask';
                container.addChild(mask);
                sprite.mask = mask;
              }

              app.stage.addChild(container);
              vfxSprites.set(vfx.id, container);
            }

            container.x = offsetX + (vfx.position.x / 100) * screenW;
            container.y = offsetY + (vfx.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            const progress = Math.min(1, vfx.elapsedMs / vfx.durationMs);

            if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
              animConfig.layers?.forEach((layer, layerIdx) => {
                const sprite = container.getChildByLabel(`vfx_layer_${layerIdx}`) as
                  | PIXI.Sprite
                  | undefined;
                if (sprite) {
                  const baseScale = tdConfig.scale ?? 0.3;
                  const ox = tdConfig.offsetX ?? 0;
                  const oy = tdConfig.offsetY ?? 0;

                  const values = interpolateKeyframes(layer.keyframes, progress);

                  sprite.scale.set(baseScale * values.scaleX, baseScale * values.scaleY);
                  sprite.x = ox + values.x;
                  sprite.y = oy + values.y;
                  sprite.rotation = (values.rotation * Math.PI) / 180;
                  sprite.alpha = values.alpha;
                }
              });
            } else {
              const sprite = container.getChildByLabel('vfx_sprite') as
                | PIXI.Sprite
                | undefined;
              const mask = container.getChildByLabel('vfx_mask') as
                | PIXI.Graphics
                | undefined;

              if (sprite) {
                applyTDUnitTransforms(
                  {
                    ...vfx,
                    hp: 1,
                    maxHp: 1,
                    facingDirection: vfx.facingDirection || 'down',
                  } as BaseTDUnit,
                  sprite,
                  new PIXI.Graphics(), // dummy shadow
                  vfx.configId,
                  undefined,
                  (t) => {
                    if (!isDestroyed) sprite.texture = t;
                  }
                );

                if (animConfig) {
                  // Handle Alpha/Fade
                  if (
                    animConfig.fadeOutProgress !== undefined &&
                    progress > animConfig.fadeOutProgress
                  ) {
                    const fadePortion = 1 - animConfig.fadeOutProgress;
                    container.alpha =
                      1 - (progress - animConfig.fadeOutProgress) / fadePortion;
                  } else {
                    container.alpha = 1;
                  }

                  // Handle Masks based on Type
                  if (mask) {
                    switch (animConfig.type) {
                      case 'WIPE_LINEAR': {
                        const size = animConfig.maskSize || 200;
                        mask.clear();
                        mask.rotation = animConfig.maskRotation || 0;
                        const wipeProgress = Math.min(1, progress * 1.5); // Finishes wiping before full duration usually
                        mask.rect(
                          -size,
                          -size,
                          size * 2,
                          size * 2 * wipeProgress
                        );
                        mask.fill(0xffffff);
                        break;
                      }
                      case 'FADE':
                      case 'SCALE':
                      case 'CUSTOM':
                      default: {
                        const size = 500;
                        mask.clear();
                        mask.rect(-size, -size, size * 2, size * 2);
                        mask.fill(0xffffff);
                        break;
                      }
                    }
                  }
                } else {
                  // Default fallback if no config
                  container.alpha = progress > 0.8 ? 1 - (progress - 0.8) * 5 : 1;
                  if (mask) {
                    const size = 500;
                    mask.clear();
                    mask.rect(-size, -size, size * 2, size * 2);
                    mask.fill(0xffffff);
                  }
                }
              }
            }
          }

          // --- Render Floating Texts ---
          const currentFtIds = new Set(engine.floatingTexts.map((ft) => ft.id));
          for (const [id, textObj] of floatingTextSprites.entries()) {
            if (!currentFtIds.has(id)) {
              app.stage.removeChild(textObj);
              textObj.destroy();
              floatingTextSprites.delete(id);
            }
          }
          for (const ft of engine.floatingTexts) {
            let textObj = floatingTextSprites.get(ft.id);
            if (!textObj) {
              textObj = new PIXI.Text({
                text: ft.text,
                style: {
                  fontFamily: 'monospace',
                  fontSize: Math.max(16, viewportH * 0.02) * (ft.scale ?? 1),
                  fontWeight: 'bold',
                  fill: ft.color ?? 0xffffff,
                  stroke: { color: 0x000000, width: 3 },
                },
              });
              textObj.anchor.set(0.5);
              app.stage.addChild(textObj);

              // Render on top
              app.stage.setChildIndex(textObj, app.stage.children.length - 1);

              floatingTextSprites.set(ft.id, textObj);
            }

            const progress = ft.elapsedMs / ft.durationMs;

            textObj.x = offsetX + (ft.position.x / 100) * screenW;
            // Float up calculation: start at position, go up by up to 5% of screen height
            textObj.y =
              offsetY +
              (ft.position.y / 100) * screenH -
              progress * screenH * 0.05 -
              screenH * 0.02;
            textObj.scale.set(zoom);
            textObj.alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
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
        <div ref={containerRef} className="absolute inset-0" />
        <div
          ref={fpsRef}
          className="absolute top-2 left-2 bg-black/60 text-green-400 font-mono font-bold px-2 py-1 text-sm rounded shadow select-none pointer-events-none z-10"
        >
          FPS: 0
        </div>

        {/* Zoom Controls */}
        {backgroundScale > 1 && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
            <button
              className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-lg font-bold text-lg select-none cursor-pointer flex items-center justify-center transition-colors"
              onClick={() => {
                zoomRef.current = Math.min(1, zoomRef.current + 0.1);
              }}
            >
              +
            </button>
            <button
              className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-lg font-bold text-lg select-none cursor-pointer flex items-center justify-center transition-colors"
              onClick={() => {
                const minZoom = 1 / backgroundScale;
                zoomRef.current = Math.max(minZoom, zoomRef.current - 0.1);
              }}
            >
              −
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default PixiBattlefield;
