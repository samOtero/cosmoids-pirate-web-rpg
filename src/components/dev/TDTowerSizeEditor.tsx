'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import {
  SENTICLE,
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { Creature } from '@/types/baseGame';

// Map variable names to creatures for both display and saving
const ALL_CREATURES: { varName: string; creature: Creature }[] = [
  { varName: 'BUG_STAGE_1', creature: BUG_STAGE_1 },
  { varName: 'BUG_STAGE_2', creature: BUG_STAGE_2 },
  { varName: 'BUG_STAGE_3', creature: BUG_STAGE_3 },
  { varName: 'STARTER_CRAB', creature: STARTER_CRAB },
  { varName: 'STARTER_IGUANA', creature: STARTER_IGUANA },
  { varName: 'STARTER_MONKEY', creature: STARTER_MONKEY },
  { varName: 'SENTICLE', creature: SENTICLE },
];

export default function TDTowerSizeEditor({
  onClose,
}: {
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedEntry = ALL_CREATURES[selectedIndex];
  const creature = selectedEntry.creature;

  // Position state – initialized from creature data or defaults
  const [scale, setScale] = useState(creature.tdSpriteScale ?? 1);
  const [shadowScaleX, setShadowScaleX] = useState(
    creature.tdShadowScaleX ?? 1
  );
  const [shadowScaleY, setShadowScaleY] = useState(
    creature.tdShadowScaleY ?? 1
  );
  const [shadowOffsetX, setShadowOffsetX] = useState(
    creature.tdShadowOffsetX ?? 0
  );
  const [shadowOffsetY, setShadowOffsetY] = useState(
    creature.tdShadowOffsetY ?? 0
  );

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const shadowScaleXRef = useRef(shadowScaleX);
  const shadowScaleYRef = useRef(shadowScaleY);
  const shadowOffsetXRef = useRef(shadowOffsetX);
  const shadowOffsetYRef = useRef(shadowOffsetY);

  // Keep ref in sync for PIXI ticker without re-instantiating PIXI
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    shadowScaleXRef.current = shadowScaleX;
  }, [shadowScaleX]);
  useEffect(() => {
    shadowScaleYRef.current = shadowScaleY;
  }, [shadowScaleY]);
  useEffect(() => {
    shadowOffsetXRef.current = shadowOffsetX;
  }, [shadowOffsetX]);
  useEffect(() => {
    shadowOffsetYRef.current = shadowOffsetY;
  }, [shadowOffsetY]);

  // When creature selection changes, load its saved values
  const handleCreatureChange = (index: number) => {
    setSelectedIndex(index);
    const c = ALL_CREATURES[index].creature;
    setScale(c.tdSpriteScale ?? 1);
    setShadowScaleX(c.tdShadowScaleX ?? 1);
    setShadowScaleY(c.tdShadowScaleY ?? 1);
    setShadowOffsetX(c.tdShadowOffsetX ?? 0);
    setShadowOffsetY(c.tdShadowOffsetY ?? 0);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/dev/save-creature-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatureVarName: selectedEntry.varName,
          tdSpriteScale: scale,
          tdShadowScaleX: shadowScaleX,
          tdShadowScaleY: shadowScaleY,
          tdShadowOffsetX: shadowOffsetX,
          tdShadowOffsetY: shadowOffsetY,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`✅ Saved ${selectedEntry.varName}!`);
      } else {
        setStatusMsg(`❌ ${data.error}`);
      }
    } catch (err) {
      setStatusMsg('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  // PIXI App Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const app = new PIXI.Application();
    let isDestroyed = false;
    let sprite: PIXI.Sprite | null = null;
    let box: PIXI.Graphics | null = null;
    let shadow: PIXI.Graphics | null = null;

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        preference: 'webgl',
      });

      if (isDestroyed) {
        try {
          app.destroy(true, { children: true });
        } catch (e) {
          console.warn('Pixi cleanup error:', e);
        }
        return;
      }
      containerRef.current!.appendChild(app.canvas);

      // Grid background
      const bg = new PIXI.Graphics();
      app.stage.addChild(bg);

      // 80x80 reference box
      box = new PIXI.Graphics();
      app.stage.addChild(box);

      // Shadow
      shadow = new PIXI.Graphics();
      app.stage.addChild(shadow);

      const spriteUrl = creature.battleSpriteUrl || creature.spriteUrl;
      const texture = await PIXI.Assets.load(spriteUrl);
      if (isDestroyed) return;

      sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      app.stage.addChild(sprite);

      app.ticker.add(() => {
        if (!app.screen) return;
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;

        // Draw grid
        bg.clear();
        bg.rect(0, 0, app.screen.width, app.screen.height);
        bg.fill({ color: 0x1e293b }); // slate-800

        // Draw grid lines
        bg.stroke({ color: 0x334155, width: 1 });
        const step = 40;
        for (let i = 0; i < app.screen.width; i += step) {
          bg.moveTo(i, 0).lineTo(i, app.screen.height);
        }
        for (let i = 0; i < app.screen.height; i += step) {
          bg.moveTo(0, i).lineTo(app.screen.width, i);
        }

        // Draw reference box (80x80)
        box!.clear();
        box!.rect(centerX - 40, centerY - 40, 80, 80);
        box!.stroke({ color: 0xef4444, width: 2, alpha: 0.5 }); // Red reference box

        if (shadow) {
          shadow.clear();
          const currentShadowScaleX = shadowScaleXRef.current;
          const currentShadowScaleY = shadowScaleYRef.current;
          shadow.ellipse(
            centerX + shadowOffsetXRef.current,
            centerY + 30 * scaleRef.current + shadowOffsetYRef.current,
            25 * currentShadowScaleX,
            12 * currentShadowScaleY
          );
          shadow.fill({ color: 0x000000, alpha: 0.4 });
        }

        if (sprite) {
          sprite.x = centerX;
          sprite.y = centerY;
          const currentScale = scaleRef.current;
          sprite.scale.set(currentScale);
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      try {
        app.destroy(true, { children: true });
      } catch (e) {
        console.warn('Pixi cleanup error:', e);
      }
    };
  }, [creature.id, creature.battleSpriteUrl, creature.spriteUrl]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col bg-black/95 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-700 shrink-0">
        <h2 className="font-bold text-sm text-slate-300">
          TD Tower Size Editor
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Controls Panel */}
        <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-700 overflow-y-auto p-3 space-y-4">
          {/* Creature Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Creature
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => handleCreatureChange(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {ALL_CREATURES.map((entry, i) => (
                <option key={entry.varName} value={i}>
                  {entry.creature.name} ({entry.varName})
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Tower Sprite Scale
            </label>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale (Default is 1 = Original Size)</span>
                <span className="font-mono text-cyan-400">
                  {scale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>

            {/* Shadow Scale X */}
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mt-4">
              Tower Shadow Shape
            </label>
            <div className="space-y-0.5 mt-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale X (Default is 1)</span>
                <span className="font-mono text-cyan-400">
                  {shadowScaleX.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={shadowScaleX}
                onChange={(e) => setShadowScaleX(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>
            {/* Shadow Scale Y */}
            <div className="space-y-0.5 mt-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale Y (Default is 1)</span>
                <span className="font-mono text-cyan-400">
                  {shadowScaleY.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={shadowScaleY}
                onChange={(e) => setShadowScaleY(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>
            {/* Shadow Offset X */}
            <div className="space-y-0.5 mt-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Offset X (Default is 0)</span>
                <span className="font-mono text-cyan-400">
                  {shadowOffsetX}px
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={shadowOffsetX}
                onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>
            {/* Shadow Offset Y */}
            <div className="space-y-0.5 mt-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Offset Y (Default is 0)</span>
                <span className="font-mono text-cyan-400">
                  {shadowOffsetY}px
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={shadowOffsetY}
                onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 border-t border-slate-700 space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 px-3 py-2 rounded text-xs font-bold text-white transition"
            >
              {saving ? 'Saving...' : 'Save to creatures.ts'}
            </button>
            {statusMsg && (
              <p className="text-[10px] text-center">{statusMsg}</p>
            )}
          </div>

          {/* Current Values Display */}
          <div className="pt-2 border-t border-slate-700">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Current Values
            </label>
            <pre className="mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-[10px] text-cyan-300 font-mono whitespace-pre-wrap">
              {JSON.stringify(
                {
                  tdSpriteScale: scale,
                  tdShadowScaleX: shadowScaleX,
                  tdShadowScaleY: shadowScaleY,
                  tdShadowOffsetX: shadowOffsetX,
                  tdShadowOffsetY: shadowOffsetY,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Preview Area — PIXI Canvas */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Crosshair Guide */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-full h-px bg-cyan-700/50 absolute top-1/2 -translate-y-1/2" />
            <div className="h-full w-px bg-cyan-700/50 absolute left-1/2 -translate-x-1/2" />
          </div>

          {/* Info Overlay */}
          <div className="absolute top-3 left-3 z-30 bg-black/80 backdrop-blur-sm rounded px-2 py-1 shadow border border-slate-700">
            <p className="text-[10px] text-slate-300">
              <span className="text-red-400 font-bold">Red Box</span> = Base
              80x80 size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
