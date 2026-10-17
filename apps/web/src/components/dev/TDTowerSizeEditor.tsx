'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorSource } from './useEditorSource';
import EditorSourceStatus from './EditorSourceStatus';
import * as PIXI from 'pixi.js';
import * as CREATURES from '@/constants/creatures';

import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';

const BATTLE_SPRITES = [
  '/battles/cosmoids/bug-1-basic-normal-neutral-skin-1.webp',
  '/battles/cosmoids/bug-2-basic-normal-neutral-skin-1.webp',
  '/battles/cosmoids/bug_1_down_1.webp',
  '/battles/cosmoids/bug_1_left_1.webp',
  '/battles/cosmoids/bug_1_up_1.webp',
  '/battles/cosmoids/eel-basic-normal-neutral-skin-1_transparent_actual.webp',
  '/battles/cosmoids/eel-basic-normal-neutral-skin-battle-ground-2.webp',
  '/battles/cosmoids/fueguana_down_1_v2.webp',
  '/battles/cosmoids/fueguana_down_1_v3.webp',
  '/battles/cosmoids/fueguana_left_1.webp',
  '/battles/cosmoids/fueguana_left_1_v2.webp',
  '/battles/cosmoids/fueguana_left_1_v3.webp',
  '/battles/cosmoids/fueguana_up_1_v2.webp',
  '/battles/cosmoids/fueguana_up_1_v3.webp',
  '/battles/cosmoids/iguana_starter_fire_neutral_skin_1_transparent_actual.webp',
  '/battles/cosmoids/monkeg_down_1.webp',
  '/battles/cosmoids/monkeg_down_1_v2.webp',
  '/battles/cosmoids/monkeg_left_1.webp',
  '/battles/cosmoids/monkeg_left_1_v2.webp',
  '/battles/cosmoids/monkeg_up_1.webp',
  '/battles/cosmoids/monkeg_up_1_v2.webp',
  '/battles/cosmoids/moth-basic-normal-neutral-skin-1.webp',
  '/battles/cosmoids/palmit_down_1.webp',
  '/battles/cosmoids/palmit_left_1.webp',
  '/battles/cosmoids/palmit_up_1.webp',
  '/battles/cosmoids/parrot_fainted.webp',
  '/battles/cosmoids/senticle_down_1.webp',
  '/battles/cosmoids/senticle_left_1.webp',
  '/battles/cosmoids/senticle_up_1.webp',
  '/battles/units/map_1.webp',
  '/battles/units/coin_1.webp',
  '/battles/characters/caleb_battle.webp',
  '/battles/characters/pirate_grunt_battle.webp',
  '/battles/characters/rat_catcher_battle.webp',
  '/battles/characters/grandpa_battle.webp',
  '/battles/characters/lance_calm_battle.webp',
  '/battles/units/note_1.webp',
  '/battles/cosmoids/mouse_1_down_1_25.webp',
  '/battles/cosmoids/mouse_1_left_1_25.webp',
  '/battles/cosmoids/mouse_1_up_1_25.webp',
  '/battles/cosmoids/bird_1_down_1_25.webp',
  '/battles/cosmoids/bird_1_left_1_25.webp',
  '/battles/cosmoids/bird_1_up_1_25.webp',
  '/battles/cosmoids/mopup_left.webp',
  '/battles/cosmoids/mopup_up.webp',
  '/battles/cosmoids/mopup_down.webp',
];

const ALL_CONFIG_KEYS = Object.keys(CREATURE_TD_CONFIGS);
const ALL_CREATURES_LIST = Object.values(CREATURES).filter(
  (c: any) => c && typeof c === 'object' && 'id' in c && 'baseStats' in c
) as import('@/types/baseGame').CosmoidTemplate[];

export default function TDTowerSizeEditor({
  onClose,
}: {
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedConfigKey = ALL_CONFIG_KEYS[selectedIndex];
  const creature = ALL_CREATURES_LIST.find(
    (c) => c.visualConfigId === selectedConfigKey
  );

  const [selectedDirection, setSelectedDirection] = useState<
    'default' | 'up' | 'down' | 'left' | 'right'
  >('default');

  const [currentTdConfig, setCurrentTdConfig] = useState<any>(
    JSON.parse(
      JSON.stringify(
        CREATURE_TD_CONFIGS[selectedConfigKey] || { default: { scale: 1 } }
      )
    )
  );

  const activeConfig = currentTdConfig[selectedDirection] || {};
  const source = useEditorSource(
    'visuals',
    selectedConfigKey,
    setCurrentTdConfig
  );
  const scale = activeConfig.scale ?? 1;
  const shadowScaleX = activeConfig.shadowScaleX ?? 1;
  const shadowScaleY = activeConfig.shadowScaleY ?? 1;
  const shadowOffsetX = activeConfig.shadowOffsetX ?? 0;
  const shadowOffsetY = activeConfig.shadowOffsetY ?? 0;
  const offsetX = activeConfig.offsetX ?? 0;
  const offsetY = activeConfig.offsetY ?? 0;
  const flipX = activeConfig.flipX ?? false;
  const healthBarOffsetY =
    activeConfig.healthBarOffsetY ??
    currentTdConfig.default?.healthBarOffsetY ??
    -40;
  const spriteUrl =
    activeConfig.url ||
    (creature ? creature.battleSpriteUrl || creature.spriteUrl : '');

  const updateActiveConfig = (updates: any) => {
    setCurrentTdConfig((prev: any) => ({
      ...prev,
      [selectedDirection]: {
        ...(prev[selectedDirection] || {}),
        ...updates,
      },
    }));
  };

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const shadowScaleXRef = useRef(shadowScaleX);
  const shadowScaleYRef = useRef(shadowScaleY);
  const shadowOffsetXRef = useRef(shadowOffsetX);
  const shadowOffsetYRef = useRef(shadowOffsetY);
  const offsetXRef = useRef(offsetX);
  const offsetYRef = useRef(offsetY);
  const flipXRef = useRef(flipX);
  const healthBarOffsetYRef = useRef(healthBarOffsetY);
  const spriteUrlRef = useRef(spriteUrl);

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
  useEffect(() => {
    offsetXRef.current = offsetX;
  }, [offsetX]);
  useEffect(() => {
    offsetYRef.current = offsetY;
  }, [offsetY]);
  useEffect(() => {
    flipXRef.current = flipX;
  }, [flipX]);
  useEffect(() => {
    healthBarOffsetYRef.current = healthBarOffsetY;
  }, [healthBarOffsetY]);
  useEffect(() => {
    spriteUrlRef.current = spriteUrl;
  }, [spriteUrl]);

  const handleConfigChange = (index: number) => {
    setSelectedIndex(index);
    const key = ALL_CONFIG_KEYS[index];
    setCurrentTdConfig(
      JSON.parse(
        JSON.stringify(CREATURE_TD_CONFIGS[key] || { default: { scale: 1 } })
      )
    );
    setSelectedDirection('default');
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      // Create a clean copy to save
      const configToSave = JSON.parse(JSON.stringify(currentTdConfig));

      await source.save(
        '/api/dev/save-creature-position',
        {
          creatureId: selectedConfigKey,
          tdConfig: configToSave,
        },
        configToSave
      );
      setStatusMsg(`✅ Saved ${selectedConfigKey}!`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Network error');
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
    let hpBg: PIXI.Graphics | null = null;
    let hpFg: PIXI.Graphics | null = null;

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        preference: 'webgl',
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
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

      sprite = new PIXI.Sprite();
      sprite.anchor.set(0.5);
      app.stage.addChild(sprite);

      hpBg = new PIXI.Graphics();
      app.stage.addChild(hpBg);

      hpFg = new PIXI.Graphics();
      app.stage.addChild(hpFg);

      // Keep track of loaded url to prevent constant reloading
      let currentLoadedUrl = '';

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
          const bScale = scaleRef.current;
          shadow.ellipse(
            centerX + shadowOffsetXRef.current,
            centerY + 30 * bScale + shadowOffsetYRef.current,
            25 * currentShadowScaleX,
            12 * currentShadowScaleY
          );
          shadow.fill({ color: 0x000000, alpha: 0.4 });
          shadow.scale.x = flipXRef.current ? -1 : 1;
        }

        if (sprite) {
          sprite.x = centerX + offsetXRef.current;
          sprite.y = centerY + offsetYRef.current;
          const bScale = scaleRef.current;
          sprite.scale.x = flipXRef.current ? -bScale : bScale;
          sprite.scale.y = bScale;

          if (currentLoadedUrl !== spriteUrlRef.current) {
            currentLoadedUrl = spriteUrlRef.current;
            PIXI.Assets.load(spriteUrlRef.current).then((t) => {
              if (!isDestroyed && sprite) sprite.texture = t;
            });
          }
        }

        if (hpBg && hpFg) {
          const hpY = centerY + healthBarOffsetYRef.current;
          hpBg.clear();
          hpBg.rect(centerX - 33, hpY - 1, 66, 6);
          hpBg.fill({ color: 0x000000 });
          hpBg.stroke({ color: 0x111111, width: 1 });

          hpFg.clear();
          hpFg.rect(centerX - 32, hpY, 64, 4);
          hpFg.fill({ color: 0x22c55e });
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
  }, [selectedConfigKey, creature?.battleSpriteUrl, creature?.spriteUrl]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col bg-black/95 font-sans text-white">
      <EditorSourceStatus source={source} onClose={onClose} />
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-950 px-4 py-2">
        <h2 className="text-sm font-bold text-slate-300">
          TD Tower Size Editor
        </h2>
        <button
          onClick={onClose}
          className="rounded px-3 py-1 text-slate-400 transition hover:bg-slate-700 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Controls Panel */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto border-r border-slate-700 bg-slate-900 p-3">
          {/* Config Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              TD Config ID
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => handleConfigChange(Number(e.target.value))}
              className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              {ALL_CONFIG_KEYS.map((key, i) => (
                <option key={key} value={i}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Direction Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Direction Config
            </label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value as any)}
              className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              {['default', 'up', 'down', 'left', 'right'].map((dir) => (
                <option key={dir} value={dir}>
                  {dir} {currentTdConfig[dir] ? '(Configured)' : '(Inherits)'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 border-t border-slate-700 pt-2">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Sprite Image
            </label>
            <select
              value={spriteUrl}
              onChange={(e) => updateActiveConfig({ url: e.target.value })}
              className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">-- Inherit Base Sprite --</option>
              {BATTLE_SPRITES.map((url) => (
                <option key={url} value={url}>
                  {url.split('/').pop()}
                </option>
              ))}
            </select>
            {creature &&
              spriteUrl ===
                (creature.battleSpriteUrl || creature.spriteUrl) && (
                <p className="text-[10px] text-slate-500 italic">
                  Inheriting default creature sprite
                </p>
              )}
          </div>

          {/* Sliders */}
          <div className="space-y-3 border-t border-slate-700 pt-2">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
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
                min={-2}
                max={5}
                step={0.01}
                value={scale}
                onChange={(e) =>
                  updateActiveConfig({ scale: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>

            {/* Flip X Toggle */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-bold tracking-wider text-slate-500 uppercase">
                Flip Sprite X
              </span>
              <button
                onClick={() => updateActiveConfig({ flipX: !flipX })}
                className={`rounded border px-3 py-1 text-xs transition ${flipX ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400' : 'border-slate-600 bg-slate-800 text-slate-400'}`}
              >
                {flipX ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Shadow Scale X */}
            <label className="mt-4 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Tower Shadow Shape
            </label>
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale X (Default is 1)</span>
                <span className="font-mono text-cyan-400">
                  {shadowScaleX.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.05}
                value={shadowScaleX}
                onChange={(e) =>
                  updateActiveConfig({ shadowScaleX: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
            {/* Shadow Scale Y */}
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale Y (Default is 1)</span>
                <span className="font-mono text-cyan-400">
                  {shadowScaleY.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.05}
                value={shadowScaleY}
                onChange={(e) =>
                  updateActiveConfig({ shadowScaleY: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
            {/* Shadow Offset X */}
            <div className="mt-2 space-y-0.5">
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
                onChange={(e) =>
                  updateActiveConfig({ shadowOffsetX: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
            {/* Shadow Offset Y */}
            <div className="mt-2 space-y-0.5">
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
                onChange={(e) =>
                  updateActiveConfig({ shadowOffsetY: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>

            {/* Sprite Offset X */}
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Sprite Offset X (Default is 0)</span>
                <span className="font-mono text-cyan-400">{offsetX}px</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={offsetX}
                onChange={(e) =>
                  updateActiveConfig({ offsetX: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
            {/* Sprite Offset Y */}
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Sprite Offset Y (Default is 0)</span>
                <span className="font-mono text-cyan-400">{offsetY}px</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={offsetY}
                onChange={(e) =>
                  updateActiveConfig({ offsetY: Number(e.target.value) })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
            {/* Health Bar Offset Y */}
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Health Bar Offset Y (Default is -40)</span>
                <span className="font-mono text-cyan-400">
                  {healthBarOffsetY}px
                </span>
              </div>
              <input
                type="range"
                min={-500}
                max={500}
                step={1}
                value={healthBarOffsetY}
                onChange={(e) =>
                  updateActiveConfig({
                    healthBarOffsetY: Number(e.target.value),
                  })
                }
                className="h-2 w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="space-y-2 border-t border-slate-700 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded bg-green-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500"
            >
              {saving ? 'Saving...' : 'Save to creatures.ts'}
            </button>
            {statusMsg && (
              <p className="text-center text-[10px]">{statusMsg}</p>
            )}
          </div>

          {/* Current Values Display */}
          <div className="border-t border-slate-700 pt-2">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Current Values
            </label>
            <pre className="mt-1 overflow-x-auto rounded border border-slate-700 bg-slate-950 p-2 font-mono text-[10px] whitespace-pre-wrap text-cyan-300">
              {JSON.stringify(currentTdConfig, null, 2)}
            </pre>
          </div>
        </div>

        {/* Preview Area — PIXI Canvas */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Crosshair Guide */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-cyan-700/50" />
            <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-cyan-700/50" />
          </div>

          {/* Info Overlay */}
          <div className="absolute top-3 left-3 z-30 rounded border border-slate-700 bg-black/80 px-2 py-1 shadow backdrop-blur-sm">
            <p className="text-[10px] text-slate-300">
              <span className="font-bold text-red-400">Red Box</span> = Base
              80x80 size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
