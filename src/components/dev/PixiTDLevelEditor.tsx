import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { TDInitialView } from '@/engine/tower-defense/types';
import { TD_BASE_HEIGHT } from '@/constants/game';
import { resolveTDInitialView } from '@/utils/tdInitialView';
import { applyTDUnitTransforms } from '@/utils/tdUnitVisuals';
import {
  clampTDLevelEditorScroll,
  getTDLevelEditorScrollLimits,
} from '@/utils/tdLevelEditorViewport';

export type PointType = 'PATH' | 'PLACEMENT' | 'CAPTURE' | 'ENVIRONMENT';

interface PixiTDLevelEditorProps {
  paths: { x: number; y: number }[][];
  activePathIndex: number;
  placementSpots: { x: number; y: number }[];
  captureUnits: { x: number; y: number; tdConfigId?: string }[];
  environmentUnits: {
    position: { x: number; y: number };
    tdConfigId: string;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
  }[];
  deleteMode: boolean;
  onPointMove: (type: PointType, index: number, x: number, y: number) => void;
  onPointDelete: (type: PointType, index: number) => void;
  backgroundUrl?: string;
  backgroundScale?: number;
  initialView?: TDInitialView;
}

export default function PixiTDLevelEditor({
  paths,
  activePathIndex,
  placementSpots,
  captureUnits,
  environmentUnits,
  deleteMode,
  onPointMove,
  onPointDelete,
  backgroundUrl,
  backgroundScale = 1,
  initialView,
}: PixiTDLevelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPointMoveRef = useRef(onPointMove);
  const onPointDeleteRef = useRef(onPointDelete);
  const deleteModeRef = useRef(deleteMode);
  const pathsRef = useRef(paths);
  const activePathIndexRef = useRef(activePathIndex);
  const placementSpotsRef = useRef(placementSpots);
  const captureUnitsRef = useRef(captureUnits);
  const environmentUnitsRef = useRef(environmentUnits);
  const backgroundUrlRef = useRef(backgroundUrl);
  const backgroundScaleRef = useRef(backgroundScale);
  const initialViewRef = useRef(initialView);
  const shouldApplyInitialViewRef = useRef(true);
  const scrollRef = useRef({ x: 0, y: 0 });
  const isScrollDraggingRef = useRef(false);
  const scrollDragStartRef = useRef<{
    x: number;
    y: number;
    scrollX: number;
    scrollY: number;
  } | null>(null);

  useEffect(() => {
    backgroundUrlRef.current = backgroundUrl;
    shouldApplyInitialViewRef.current = true;
  }, [backgroundUrl]);
  useEffect(() => {
    backgroundScaleRef.current = backgroundScale;
    shouldApplyInitialViewRef.current = true;
  }, [backgroundScale]);
  useEffect(() => {
    initialViewRef.current = initialView;
    shouldApplyInitialViewRef.current = true;
  }, [initialView]);

  useEffect(() => {
    onPointMoveRef.current = onPointMove;
  }, [onPointMove]);
  useEffect(() => {
    onPointDeleteRef.current = onPointDelete;
  }, [onPointDelete]);
  useEffect(() => {
    deleteModeRef.current = deleteMode;
  }, [deleteMode]);
  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);
  useEffect(() => {
    activePathIndexRef.current = activePathIndex;
  }, [activePathIndex]);
  useEffect(() => {
    placementSpotsRef.current = placementSpots;
  }, [placementSpots]);
  useEffect(() => {
    captureUnitsRef.current = captureUnits;
  }, [captureUnits]);
  useEffect(() => {
    environmentUnitsRef.current = environmentUnits;
  }, [environmentUnits]);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    let isDestroyed = false;
    let isInitialized = false;

    // We store the PIXI graphics objects to update them in the ticker
    const pathGraphics = new PIXI.Graphics();

    // Maps for Point Containers so we can reuse them instead of destroying and recreating
    const pathNodes = new Map<number, PIXI.Container>();
    const placementNodes = new Map<number, PIXI.Container>();
    const captureNodes = new Map<number, PIXI.Container>();
    const environmentNodes = new Map<number, PIXI.Container>();

    let bgBounds = { x: 0, y: 0, width: 0, height: 0 };

    // Track dragging state
    let draggingNode: PIXI.Container | null = null;
    let draggingInfo: { type: PointType; index: number } | null = null;

    const onDragEnd = () => {
      if (draggingNode) {
        if (!deleteModeRef.current) {
          draggingNode.cursor = 'grab';
        }
        draggingNode = null;
        draggingInfo = null;
      }
    };

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
      let currentBgUrl =
        backgroundUrlRef.current || '/battles/bg/bg_dock_battle_td.png';
      await PIXI.Assets.load(currentBgUrl);
      if (isDestroyed) return;

      const bgSprite = PIXI.Sprite.from(currentBgUrl);
      app.stage.addChildAt(bgSprite, 0); // Background at bottom

      let fullBgHeight = 0;
      let fullBgWidth = 0;
      let displayBgHeight = 0;
      let displayBgWidth = 0;

      // Handle resize — reads scale from ref so it stays current
      const updateBgLayout = () => {
        if (
          bgSprite.texture.width > 0 &&
          bgSprite.texture.height > 0 &&
          app.screen.height > 0
        ) {
          const scale = Math.max(1, backgroundScaleRef.current);
          const resolvedView = resolveTDInitialView(
            scale,
            initialViewRef.current
          );
          const ratio = bgSprite.texture.width / bgSprite.texture.height;
          fullBgHeight = app.screen.height * scale;
          fullBgWidth = fullBgHeight * ratio;
          displayBgHeight = fullBgHeight * resolvedView.zoom;
          displayBgWidth = fullBgWidth * resolvedView.zoom;
          bgSprite.height = displayBgHeight;
          bgSprite.width = displayBgWidth;

          const maxScrollY = Math.max(0, displayBgHeight - app.screen.height);
          const maxScrollX = Math.max(0, displayBgWidth - app.screen.width);
          if (shouldApplyInitialViewRef.current) {
            scrollRef.current = {
              x: maxScrollX * (resolvedView.offsetX / 100),
              y: maxScrollY * (resolvedView.offsetY / 100),
            };
            shouldApplyInitialViewRef.current = false;
          } else {
            const limits = getTDLevelEditorScrollLimits(
              displayBgWidth,
              displayBgHeight,
              app.screen.width,
              app.screen.height
            );
            scrollRef.current.x = clampTDLevelEditorScroll(
              scrollRef.current.x,
              limits.minX,
              limits.maxX
            );
            scrollRef.current.y = clampTDLevelEditorScroll(
              scrollRef.current.y,
              limits.minY,
              limits.maxY
            );
          }

          const centeredX = Math.max(
            0,
            (app.screen.width - displayBgWidth) / 2
          );
          const centeredY = Math.max(
            0,
            (app.screen.height - displayBgHeight) / 2
          );
          bgSprite.x = centeredX - scrollRef.current.x;
          bgSprite.y = centeredY - scrollRef.current.y;

          bgBounds = {
            x: bgSprite.x,
            y: bgSprite.y,
            width: bgSprite.width,
            height: bgSprite.height,
          };
        }
      };
      app.renderer.on('resize', updateBgLayout);
      updateBgLayout();

      bgSprite.eventMode = 'static';

      const beginScrollDrag = (e: PIXI.FederatedPointerEvent) => {
        if (draggingNode) return;
        isScrollDraggingRef.current = true;
        scrollDragStartRef.current = {
          x: e.global.x,
          y: e.global.y,
          scrollX: scrollRef.current.x,
          scrollY: scrollRef.current.y,
        };
      };

      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);
      // Listen on the stage so the empty overscroll area can drag the map too.
      app.stage.on('pointerdown', beginScrollDrag);
      app.stage.addChild(pathGraphics);

      app.stage.on('pointerup', () => {
        onDragEnd();
        isScrollDraggingRef.current = false;
        scrollDragStartRef.current = null;
      });
      app.stage.on('pointerupoutside', () => {
        onDragEnd();
        isScrollDraggingRef.current = false;
        scrollDragStartRef.current = null;
      });
      app.stage.on('pointermove', (e) => {
        // Handle scroll dragging
        if (isScrollDraggingRef.current && scrollDragStartRef.current) {
          const dx = scrollDragStartRef.current.x - e.global.x;
          const dy = scrollDragStartRef.current.y - e.global.y;
          const limits = getTDLevelEditorScrollLimits(
            displayBgWidth,
            displayBgHeight,
            app.screen.width,
            app.screen.height
          );
          scrollRef.current.x = clampTDLevelEditorScroll(
            scrollDragStartRef.current.scrollX + dx,
            limits.minX,
            limits.maxX
          );
          scrollRef.current.y = clampTDLevelEditorScroll(
            scrollDragStartRef.current.scrollY + dy,
            limits.minY,
            limits.maxY
          );
          const centeredX = Math.max(
            0,
            (app.screen.width - displayBgWidth) / 2
          );
          const centeredY = Math.max(
            0,
            (app.screen.height - displayBgHeight) / 2
          );
          bgSprite.x = centeredX - scrollRef.current.x;
          bgSprite.y = centeredY - scrollRef.current.y;
          bgBounds = {
            x: bgSprite.x,
            y: bgSprite.y,
            width: bgSprite.width,
            height: bgSprite.height,
          };
        }

        if (
          draggingNode &&
          draggingInfo &&
          !deleteModeRef.current &&
          bgBounds.width > 0
        ) {
          const newX = ((e.global.x - bgBounds.x) / bgBounds.width) * 100;
          const newY = ((e.global.y - bgBounds.y) / bgBounds.height) * 100;

          onPointMoveRef.current(
            draggingInfo.type,
            draggingInfo.index,
            newX,
            newY
          );
        }
      });

      const createDraggablePoint = (
        type: PointType,
        index: number,
        color: number,
        radius: number,
        strokeColor: number = 0xffffff,
        alpha: number = 1
      ) => {
        const container = new PIXI.Container();
        container.eventMode = 'static';
        container.cursor = deleteModeRef.current ? 'pointer' : 'grab';

        const g = new PIXI.Graphics();
        g.circle(0, 0, radius);
        g.fill({ color, alpha });
        g.stroke({ color: strokeColor, width: 2, alpha });

        // Add text label
        const textStyle = new PIXI.TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        const text = new PIXI.Text({
          text: index.toString(),
          style: textStyle,
        });
        text.anchor.set(0.5);

        container.addChild(g);
        container.addChild(text);

        container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
          e.stopPropagation();
          if (deleteModeRef.current) {
            onPointDeleteRef.current(type, index);
          } else {
            draggingNode = container;
            draggingInfo = { type, index };
            container.cursor = 'grabbing';
            // Pop to front
            app.stage.setChildIndex(container, app.stage.children.length - 1);
          }
        });

        container.on('pointerover', () => {
          container.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === container
              ? 'grabbing'
              : 'grab';
          g.alpha = deleteModeRef.current ? 0.5 : 0.8;
        });
        container.on('pointerout', () => {
          container.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === container
              ? 'grabbing'
              : 'grab';
          g.alpha = 1;
        });

        app.stage.addChild(container);
        return container;
      };

      const createDraggableEnvironmentUnit = (index: number) => {
        const container = new PIXI.Container();
        container.eventMode = 'static';
        container.cursor = deleteModeRef.current ? 'pointer' : 'grab';
        container.hitArea = new PIXI.Circle(0, 0, 42);

        const marker = new PIXI.Graphics();
        marker.circle(0, 0, 36);
        marker.fill({ color: 0xfacc15, alpha: 0.12 });
        marker.stroke({ color: 0xfacc15, width: 3, alpha: 0.95 });
        container.addChild(marker);

        const visual = new PIXI.Container();
        visual.label = 'environment_visual';
        const shadow = new PIXI.Graphics();
        shadow.label = 'shadow';
        visual.addChild(shadow);
        const sprite = new PIXI.Sprite();
        sprite.label = 'environment_sprite';
        sprite.anchor.set(0.5);
        visual.addChild(sprite);
        container.addChild(visual);

        const label = new PIXI.Text({
          text: `E${index}`,
          style: new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 3 },
          }),
        });
        label.label = 'environment_label';
        label.anchor.set(0.5);
        label.y = -48;
        container.addChild(label);

        container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          event.stopPropagation();
          if (deleteModeRef.current) {
            onPointDeleteRef.current('ENVIRONMENT', index);
          } else {
            draggingNode = container;
            draggingInfo = { type: 'ENVIRONMENT', index };
            container.cursor = 'grabbing';
            app.stage.setChildIndex(container, app.stage.children.length - 1);
          }
        });
        container.on('pointerover', () => {
          marker.alpha = deleteModeRef.current ? 0.5 : 1;
        });
        container.on('pointerout', () => {
          marker.alpha = 1;
        });

        app.stage.addChild(container);
        return container;
      };

      app.ticker.add(() => {
        // Re-evaluate bg layout each tick to pick up scale changes
        updateBgLayout();

        if (bgBounds.width === 0) return;

        const viewportH = app.screen.height;

        const bgUrl =
          backgroundUrlRef.current || '/battles/bg/bg_dock_battle_td.png';
        if (bgUrl !== currentBgUrl) {
          currentBgUrl = bgUrl;
          PIXI.Assets.load(bgUrl)
            .then((t) => {
              if (!isDestroyed) {
                bgSprite.texture = t as PIXI.Texture;
              }
            })
            .catch(console.error);
        }

        const currentPaths = pathsRef.current;
        const currentActivePathIndex = activePathIndexRef.current;
        const currentPlacementSpots = placementSpotsRef.current;
        const currentCaptureUnits = captureUnitsRef.current;
        const currentEnvironmentUnits = environmentUnitsRef.current;

        // Draw Path lines
        pathGraphics.clear();
        app.stage.setChildIndex(pathGraphics, 1); // just above background

        currentPaths.forEach((pathPoints, pIdx) => {
          if (pathPoints.length > 0) {
            pathGraphics.moveTo(
              bgBounds.x + (pathPoints[0].x / 100) * bgBounds.width,
              bgBounds.y + (pathPoints[0].y / 100) * bgBounds.height
            );
            for (let i = 1; i < pathPoints.length; i++) {
              pathGraphics.lineTo(
                bgBounds.x + (pathPoints[i].x / 100) * bgBounds.width,
                bgBounds.y + (pathPoints[i].y / 100) * bgBounds.height
              );
            }
            const isActive = pIdx === currentActivePathIndex;
            pathGraphics.stroke({
              color: isActive ? 0xff0000 : 0xaaaaaa,
              width: isActive ? 4 : 2,
              alpha: isActive ? 0.8 : 0.4,
            });
          }
        });

        // Render Path Points for the active path only
        const currentPathPoints = currentPaths[currentActivePathIndex] || [];
        for (const [key, node] of pathNodes.entries()) {
          if (key >= currentPathPoints.length) {
            app.stage.removeChild(node);
            node.destroy({ children: true });
            pathNodes.delete(key);
          }
        }
        currentPathPoints.forEach((pt, i) => {
          let node = pathNodes.get(i);
          if (!node) {
            node = createDraggablePoint('PATH', i, 0xff0000, 15);
            pathNodes.set(i, node);
          }
          node.x = bgBounds.x + (pt.x / 100) * bgBounds.width;
          node.y = bgBounds.y + (pt.y / 100) * bgBounds.height;
          node.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === node
              ? 'grabbing'
              : 'grab';

          // Update text just in case ordering changed due to deletes
          const text = node.children[1] as PIXI.Text;
          if (text) text.text = i.toString();
        });

        // Render Placement Spots
        for (const [key, node] of placementNodes.entries()) {
          if (key >= currentPlacementSpots.length) {
            app.stage.removeChild(node);
            node.destroy({ children: true });
            placementNodes.delete(key);
          }
        }
        currentPlacementSpots.forEach((spot, i) => {
          let node = placementNodes.get(i);
          const radius = viewportH * 0.05; // 5% of viewport width
          if (!node) {
            node = createDraggablePoint(
              'PLACEMENT',
              i,
              0xf97316,
              radius,
              0xf97316,
              0.3
            );
            placementNodes.set(i, node);
          }
          node.x = bgBounds.x + (spot.x / 100) * bgBounds.width;
          node.y = bgBounds.y + (spot.y / 100) * bgBounds.height;
          node.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === node
              ? 'grabbing'
              : 'grab';

          // Dynamically scale placement spot circles to match resize
          const g = node.children[0] as PIXI.Graphics;
          g.clear();
          g.circle(0, 0, radius);
          g.fill({ color: 0xf97316, alpha: 0.3 });
          g.stroke({ color: 0xf97316, width: 3, alpha: 0.8 });

          // Update text
          const text = node.children[1] as PIXI.Text;
          if (text) text.text = i.toString();
        });

        // Render Capture Units
        for (const [key, node] of captureNodes.entries()) {
          if (key >= currentCaptureUnits.length) {
            app.stage.removeChild(node);
            node.destroy({ children: true });
            captureNodes.delete(key);
          }
        }
        currentCaptureUnits.forEach((spot, i) => {
          let node = captureNodes.get(i);
          const radius = viewportH * 0.04;
          if (!node) {
            node = createDraggablePoint(
              'CAPTURE',
              i,
              0x9333ea, // purple
              radius,
              0x9333ea,
              0.4
            );
            captureNodes.set(i, node);
          }
          node.x = bgBounds.x + (spot.x / 100) * bgBounds.width;
          node.y = bgBounds.y + (spot.y / 100) * bgBounds.height;
          node.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === node
              ? 'grabbing'
              : 'grab';

          const g = node.children[0] as PIXI.Graphics;
          g.clear();
          g.circle(0, 0, radius);
          g.fill({ color: 0x9333ea, alpha: 0.4 });
          g.stroke({ color: 0x9333ea, width: 3, alpha: 0.9 });

          // Update text (show a 'C' before the index to distinguish)
          const text = node.children[1] as PIXI.Text;
          if (text) text.text = `C${i}`;
        });

        // Render environment units with the same visual configuration as runtime.
        for (const [key, node] of environmentNodes.entries()) {
          if (key >= currentEnvironmentUnits.length) {
            app.stage.removeChild(node);
            node.destroy({ children: true });
            environmentNodes.delete(key);
          }
        }
        currentEnvironmentUnits.forEach((unit, i) => {
          let node = environmentNodes.get(i);
          if (!node) {
            node = createDraggableEnvironmentUnit(i);
            environmentNodes.set(i, node);
          }

          node.x = bgBounds.x + (unit.position.x / 100) * bgBounds.width;
          node.y = bgBounds.y + (unit.position.y / 100) * bgBounds.height;
          node.cursor = deleteModeRef.current
            ? 'pointer'
            : draggingNode === node
              ? 'grabbing'
              : 'grab';

          const visual = node.getChildByLabel(
            'environment_visual'
          ) as PIXI.Container;
          visual.scale.set(
            resolveTDInitialView(
              backgroundScaleRef.current,
              initialViewRef.current
            ).zoom *
              (app.screen.height / TD_BASE_HEIGHT)
          );
          const sprite = visual.getChildByLabel(
            'environment_sprite'
          ) as PIXI.Sprite;
          const shadow = visual.getChildByLabel('shadow') as PIXI.Graphics;
          applyTDUnitTransforms(
            {
              id: `editor-environment-${i}`,
              position: unit.position,
              facingDirection: unit.facingDirection ?? 'down',
              hp: 1,
              maxHp: 1,
            },
            sprite,
            shadow,
            unit.tdConfigId,
            undefined,
            (texture) => {
              if (!isDestroyed) sprite.texture = texture;
            }
          );

          const label = node.getChildByLabel('environment_label') as PIXI.Text;
          label.text = `E${i}`;
        });
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (isInitialized) {
        app.destroy(true, { children: true });
      }
    };
  }, []); // Run once, strictly use refs inside ticker!

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
