import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { CutsceneData, CutsceneKeyframe } from '@/types/cutscene';
import { Creature } from '@/types/baseGame';
import { BATTLE_BACKGROUND_IMAGES } from '@/constants/game';

interface Props {
  data: CutsceneData;
  currentTimeMs: number;
  creaturesRecord: Record<string, Creature>;
  onUpdateKeyframe: (
    unitId: string,
    updates: Partial<CutsceneKeyframe>
  ) => void;
}

export default function CutscenePixiPreview({
  data,
  currentTimeMs,
  creaturesRecord,
  onUpdateKeyframe,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  const dataRef = useRef(data);
  const currentTimeMsRef = useRef(currentTimeMs);
  const creaturesRecordRef = useRef(creaturesRecord);

  const onUpdateKeyframeRef = useRef(onUpdateKeyframe);

  // Keep refs up-to-date for the Pixi event loop without recreating the loop
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    currentTimeMsRef.current = currentTimeMs;
  }, [currentTimeMs]);

  useEffect(() => {
    creaturesRecordRef.current = creaturesRecord;
  }, [creaturesRecord]);

  useEffect(() => {
    onUpdateKeyframeRef.current = onUpdateKeyframe;
  }, [onUpdateKeyframe]);

  // Initialize PIXI
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();
    let isDestroyed = false;

    const initPixi = async () => {
      await app.init({
        width: 800,
        height: 450, // 16:9 ratio approximately
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (isDestroyed) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current!.appendChild(app.canvas);
      appRef.current = app;

      // State managers for the rendering loop
      let currentBgKey = '';
      let bgSprite: PIXI.Sprite | null = null;
      const unitSprites = new Map<string, PIXI.Sprite>();
      let draggingUnitId: string | null = null;

      // Global drag handling
      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 800, 450);

      app.stage.on('pointermove', (e) => {
        if (draggingUnitId) {
          const x = Math.round(e.global.x);
          const y = Math.round(e.global.y);
          // Auto-spawn or update keyframe exactly at current time
          onUpdateKeyframeRef.current(draggingUnitId, { x, y });
        }
      });

      app.stage.on('pointerup', () => {
        draggingUnitId = null;
      });
      app.stage.on('pointerupoutside', () => {
        draggingUnitId = null;
      });

      app.ticker.add(() => {
        const currentData = dataRef.current;
        const currentMs = currentTimeMsRef.current;
        const cRec = creaturesRecordRef.current;

        if (!currentData) return;

        // 1. Draw Background
        const bgUrl = BATTLE_BACKGROUND_IMAGES[currentData.backgroundKey];
        if (bgUrl && currentBgKey !== bgUrl) {
          currentBgKey = bgUrl;
          if (bgSprite) {
            app.stage.removeChild(bgSprite);
            bgSprite.destroy();
            bgSprite = null;
          }

          PIXI.Assets.load(bgUrl).then((texture) => {
            if (isDestroyed || currentBgKey !== bgUrl) return;
            bgSprite = new PIXI.Sprite(texture);
            bgSprite.width = 800;
            bgSprite.height = 450;
            app.stage.addChildAt(bgSprite, 0); // Always put background at bottom
          });
        }

        // 2. Manage Units
        const currentUnitIds = new Set(currentData.units.map((u) => u.id));
        for (const [id, sprite] of unitSprites.entries()) {
          if (!currentUnitIds.has(id)) {
            app.stage.removeChild(sprite);
            sprite.destroy({ children: true });
            unitSprites.delete(id);
          }
        }

        // Update active units
        for (const unit of currentData.units) {
          const creatureObj = cRec[unit.speciesId];
          if (!creatureObj) continue;

          let sprite = unitSprites.get(unit.id);

          if (!sprite) {
            sprite = new PIXI.Sprite();
            sprite.anchor.set(0.5, 0.5);
            unitSprites.set(unit.id, sprite);
            app.stage.addChild(sprite);

            // Drag interaction setup
            sprite.eventMode = 'static';
            sprite.cursor = 'pointer';
            sprite.on('pointerdown', () => {
              draggingUnitId = unit.id;
            });

            const spriteUrl =
              creatureObj.battleSpriteUrl || creatureObj.spriteUrl;
            if (spriteUrl) {
              PIXI.Assets.load(spriteUrl).then((texture) => {
                if (isDestroyed || !unitSprites.has(unit.id)) return;
                const activeSprite = unitSprites.get(unit.id);
                if (activeSprite) {
                  activeSprite.texture = texture;
                }
              });
            }
          }

          // Compute keyframe interpolated state
          let state = {
            x: 400,
            y: 225,
            scale: 1,
            facingRight: true,
            opacity: 1,
          };

          if (unit.keyframes.length > 0) {
            const kfs = [...unit.keyframes].sort((a, b) => a.timeMs - b.timeMs);

            let before = kfs[0];
            let after = kfs[kfs.length - 1];

            for (let i = 0; i < kfs.length - 1; i++) {
              if (
                currentMs >= kfs[i].timeMs &&
                currentMs <= kfs[i + 1].timeMs
              ) {
                before = kfs[i];
                after = kfs[i + 1];
                break;
              }
            }

            if (currentMs <= before.timeMs) {
              state = { ...state, ...before };
            } else if (currentMs >= after.timeMs) {
              state = { ...state, ...after };
            } else {
              // Linear interpolation
              const progress =
                (currentMs - before.timeMs) / (after.timeMs - before.timeMs);
              state.x =
                (before.x ?? state.x) +
                ((after.x ?? state.x) - (before.x ?? state.x)) * progress;
              state.y =
                (before.y ?? state.y) +
                ((after.y ?? state.y) - (before.y ?? state.y)) * progress;
              state.scale =
                (before.scale ?? state.scale) +
                ((after.scale ?? state.scale) - (before.scale ?? state.scale)) *
                  progress;
              state.opacity =
                (before.opacity ?? state.opacity) +
                ((after.opacity ?? state.opacity) -
                  (before.opacity ?? state.opacity)) *
                  progress;
              state.facingRight = before.facingRight ?? state.facingRight;
            }
          }

          // Apply state to sprite
          sprite.x = state.x;
          sprite.y = state.y;
          const scaleX = state.facingRight
            ? Math.abs(state.scale)
            : -Math.abs(state.scale);
          sprite.scale.set(scaleX, Math.abs(state.scale));
          sprite.alpha = state.opacity;
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-[800px] h-[450px] border border-slate-600 bg-black shrink-0 shadow-lg relative"
    >
      {!appRef.current && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10 font-bold tracking-widest uppercase text-sm">
          Loading Engine...
        </div>
      )}
    </div>
  );
}
