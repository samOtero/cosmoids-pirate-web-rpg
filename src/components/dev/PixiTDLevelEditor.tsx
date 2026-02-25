import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export type PointType = 'PATH' | 'PLACEMENT';

interface PixiTDLevelEditorProps {
  paths: { x: number; y: number }[][];
  activePathIndex: number;
  placementSpots: { x: number; y: number }[];
  deleteMode: boolean;
  onPointMove: (type: PointType, index: number, x: number, y: number) => void;
  onPointDelete: (type: PointType, index: number) => void;
}

export default function PixiTDLevelEditor({
  paths,
  activePathIndex,
  placementSpots,
  deleteMode,
  onPointMove,
  onPointDelete,
}: PixiTDLevelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPointMoveRef = useRef(onPointMove);
  const onPointDeleteRef = useRef(onPointDelete);
  const deleteModeRef = useRef(deleteMode);
  const pathsRef = useRef(paths);
  const activePathIndexRef = useRef(activePathIndex);
  const placementSpotsRef = useRef(placementSpots);

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
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    let isDestroyed = false;
    let isInitialized = false;

    // We store the PIXI graphics objects to update them in the ticker
    const pathGraphics = new PIXI.Graphics();

    // Maps for Point Containers so we can reuse them instead of destroying and recreating
    const pathNodes = new Map<number, PIXI.Container>();
    const placementNodes = new Map<number, PIXI.Container>();

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
      app.stage.addChildAt(bgSprite, 0); // Background at bottom

      // Handle resize
      const updateAspectRatio = () => {
        if (
          bgSprite.texture.width > 0 &&
          bgSprite.texture.height > 0 &&
          app.screen.height > 0
        ) {
          const ratio = bgSprite.texture.width / bgSprite.texture.height;
          bgSprite.height = app.screen.height;
          bgSprite.width = app.screen.height * ratio;
          bgSprite.x = (app.screen.width - bgSprite.width) / 2;

          bgBounds = {
            x: bgSprite.x,
            y: bgSprite.y,
            width: bgSprite.width,
            height: bgSprite.height,
          };
        }
      };
      app.renderer.on('resize', updateAspectRatio);
      updateAspectRatio();

      bgSprite.eventMode = 'static';

      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);
      app.stage.addChild(pathGraphics);

      app.stage.on('pointerup', onDragEnd);
      app.stage.on('pointerupoutside', onDragEnd);
      app.stage.on('pointermove', (e) => {
        if (
          draggingNode &&
          draggingInfo &&
          !deleteModeRef.current &&
          bgBounds.width > 0
        ) {
          let newX = ((e.global.x - bgBounds.x) / bgBounds.width) * 100;
          let newY = ((e.global.y - bgBounds.y) / bgBounds.height) * 100;

          // Clamp to 0-100
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

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

        container.on('pointerdown', () => {
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

      app.ticker.add(() => {
        if (bgBounds.width === 0) return;

        const currentPaths = pathsRef.current;
        const currentActivePathIndex = activePathIndexRef.current;
        const currentPlacementSpots = placementSpotsRef.current;

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
          const radius = bgBounds.width * 0.05; // 5% of bg width approx
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
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
