'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEditorSource } from './useEditorSource';
import EditorSourceStatus from './EditorSourceStatus';
import * as PIXI from 'pixi.js';
import * as CREATURES from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { interpolateKeyframes } from '@/utils/animationUtils';
import {
  VFXSpriteKeyframe,
  VFXSpriteLayer,
  VFXAnimationConfig,
} from '@/types/baseGame';

const BATTLE_SPRITES = [
  '/battles/attacks/nibble_top_teeth.webp',
  '/battles/attacks/nibble_bottom_teeth.webp',
  '/battles/attacks/scratch.webp',
];

const TARGET_DUMMIES = [
  {
    id: 'senticle',
    name: 'Senticle',
    url: '/battles/cosmoids/senticle_left_1.webp',
  },
  {
    id: 'starter_crab',
    name: 'Palmit (Crab)',
    url: '/battles/cosmoids/palmit_down_1.webp',
  },
  {
    id: 'starter_iguana',
    name: 'Fueguana (Iguana)',
    url: '/battles/cosmoids/fueguana_left_1_v3.webp',
  },
  {
    id: 'starter_monkey',
    name: 'Monkeg (Monkey)',
    url: '/battles/cosmoids/monkeg_down_1_v2.webp',
  },
  {
    id: 'mouse_1',
    name: 'Mouse',
    url: '/battles/cosmoids/mouse_1_left_1_25.webp',
  },
];

export default function TDEffectEditor({ onClose }: { onClose: () => void }) {
  const allConfigs = useMemo(() => {
    return Object.keys(CREATURE_TD_CONFIGS);
  }, []);

  const attackConfigs = useMemo(() => {
    return allConfigs.filter((key) => key.startsWith('attack_'));
  }, [allConfigs]);

  const [selectedKey, setSelectedKey] = useState<string>(
    attackConfigs[0] || 'attack_nibble_1'
  );
  const [newConfigId, setNewConfigId] = useState<string>('');

  // Load configuration
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const source = useEditorSource('visuals', selectedKey, setCurrentConfig);

  // Initialize or load configuration when selectedKey changes
  useEffect(() => {
    const orig = CREATURE_TD_CONFIGS[selectedKey];
    if (orig) {
      setCurrentConfig(JSON.parse(JSON.stringify(orig)));
    } else {
      setCurrentConfig({
        default: {
          scale: 0.3,
          shadowScaleX: 1,
          shadowOffsetY: 0,
          offsetY: 0,
          vfxAnimation: {
            type: 'KEYFRAME_SPRITES',
            durationMs: 500,
            layers: [],
          },
        },
      });
    }
  }, [selectedKey]);

  // Active layer and keyframe indices
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [activeKeyframeIndex, setActiveKeyframeIndex] = useState<number>(0);

  // Playback control state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [playSpeed, setPlaySpeed] = useState<number>(1.0); // 0.1, 0.25, 0.5, 1.0, 2.0
  const [selectedDummyId, setSelectedDummyId] = useState<string>('senticle');

  // Ref fields for real-time PIXI updates
  const progressRef = useRef(progress);
  const isPlayingRef = useRef(isPlaying);
  const playSpeedRef = useRef(playSpeed);
  const configRef = useRef(currentConfig);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playSpeedRef.current = playSpeed;
  }, [playSpeed]);

  useEffect(() => {
    configRef.current = currentConfig;
  }, [currentConfig]);

  // PIXI Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeDummy =
    TARGET_DUMMIES.find((d) => d.id === selectedDummyId) || TARGET_DUMMIES[0];

  // Helper updates
  const updateConfig = (updates: any) => {
    setCurrentConfig((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.default = {
        ...(next.default || {}),
        ...updates,
      };
      return next;
    });
  };

  const updateVfxConfig = (updates: Partial<VFXAnimationConfig>) => {
    setCurrentConfig((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.default = {
        ...(next.default || {}),
        vfxAnimation: {
          ...(next.default?.vfxAnimation || {
            type: 'KEYFRAME_SPRITES',
            durationMs: 500,
            layers: [],
          }),
          ...updates,
        },
      };
      return next;
    });
  };

  // Get safe active references
  const vfxAnimation = currentConfig?.default?.vfxAnimation;
  const layers: VFXSpriteLayer[] = vfxAnimation?.layers || [];
  const activeLayer: VFXSpriteLayer | undefined = layers[activeLayerIndex];
  const keyframes: VFXSpriteKeyframe[] = activeLayer?.keyframes || [];
  const activeKeyframe: VFXSpriteKeyframe | undefined =
    keyframes[activeKeyframeIndex];

  // Layer modifiers
  const handleAddLayer = () => {
    if (!currentConfig) return;
    const newLayer: VFXSpriteLayer = {
      url: '/battles/attacks/scratch.webp',
      keyframes: [
        {
          progress: 0.0,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          alpha: 1,
        },
        {
          progress: 1.0,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          alpha: 0,
        },
      ],
    };
    const nextLayers = [...layers, newLayer];
    updateVfxConfig({ layers: nextLayers });
    setActiveLayerIndex(nextLayers.length - 1);
    setActiveKeyframeIndex(0);
  };

  const handleDeleteLayer = (idx: number) => {
    const nextLayers = layers.filter((_, i) => i !== idx);
    updateVfxConfig({ layers: nextLayers });
    setActiveLayerIndex(Math.max(0, nextLayers.length - 1));
    setActiveKeyframeIndex(0);
  };

  const updateActiveLayer = (updates: Partial<VFXSpriteLayer>) => {
    const nextLayers = layers.map((layer, idx) => {
      if (idx === activeLayerIndex) {
        return { ...layer, ...updates };
      }
      return layer;
    });
    updateVfxConfig({ layers: nextLayers });
  };

  // Keyframe modifiers
  const handleAddKeyframe = () => {
    if (!activeLayer) return;
    const targetProgress = Math.round(progressRef.current * 100) / 100;

    // Check if keyframe already exists at this exact progress
    if (keyframes.some((kf) => Math.abs(kf.progress - targetProgress) < 0.01)) {
      alert(
        `A keyframe already exists near ${Math.round(targetProgress * 100)}%`
      );
      return;
    }

    // Interpolate existing values at this progress to create a smooth initial state
    const interpolated = interpolateKeyframes(keyframes, targetProgress);
    const newKf: VFXSpriteKeyframe = {
      progress: targetProgress,
      x: Math.round(interpolated.x),
      y: Math.round(interpolated.y),
      scaleX: Math.round(interpolated.scaleX * 100) / 100,
      scaleY: Math.round(interpolated.scaleY * 100) / 100,
      rotation: Math.round(interpolated.rotation),
      alpha: Math.round(interpolated.alpha * 100) / 100,
    };

    const nextKeyframes = [...keyframes, newKf].sort(
      (a, b) => a.progress - b.progress
    );
    updateActiveLayer({ keyframes: nextKeyframes });

    const newIdx = nextKeyframes.findIndex(
      (k) => k.progress === targetProgress
    );
    if (newIdx !== -1) {
      setActiveKeyframeIndex(newIdx);
    }
  };

  const handleDeleteKeyframe = () => {
    if (keyframes.length <= 1) {
      alert('Animations must have at least one keyframe!');
      return;
    }
    const nextKeyframes = keyframes.filter(
      (_, idx) => idx !== activeKeyframeIndex
    );
    updateActiveLayer({ keyframes: nextKeyframes });
    setActiveKeyframeIndex(Math.max(0, nextKeyframes.length - 1));
  };

  const updateActiveKeyframe = (updates: Partial<VFXSpriteKeyframe>) => {
    const nextKeyframes = keyframes.map((kf, idx) => {
      if (idx === activeKeyframeIndex) {
        const updated = { ...kf, ...updates };
        // Sort if progress changed, but keep selected index matching the keyframe
        return updated;
      }
      return kf;
    });

    if (updates.progress !== undefined) {
      // Sort keyframes by progress
      const currentKf = nextKeyframes[activeKeyframeIndex];
      const sorted = [...nextKeyframes].sort((a, b) => a.progress - b.progress);
      updateActiveLayer({ keyframes: sorted });
      const newIdx = sorted.findIndex((k) => k === currentKf);
      if (newIdx !== -1) {
        setActiveKeyframeIndex(newIdx);
      }
    } else {
      updateActiveLayer({ keyframes: nextKeyframes });
    }
  };

  // Create new config key
  const handleCreateConfig = () => {
    if (!newConfigId.trim()) return;
    const cleanId = newConfigId.startsWith('attack_')
      ? newConfigId.trim()
      : `attack_${newConfigId.trim()}`;
    if (allConfigs.includes(cleanId)) {
      alert('This Config ID already exists!');
      return;
    }
    setSelectedKey(cleanId);
    setNewConfigId('');
  };

  // Save to tdConfigs.ts via dev API
  const handleSave = async () => {
    if (!currentConfig) return;
    setSaving(true);
    setStatusMsg('');
    try {
      await source.save(
        '/api/dev/save-creature-position',
        {
          creatureId: selectedKey,
          tdConfig: currentConfig,
        },
        currentConfig
      );
      setStatusMsg(`Saved ${selectedKey}!`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // PIXI Setup & Loop
  useEffect(() => {
    if (!containerRef.current) return;
    const app = new PIXI.Application();
    let isDestroyed = false;

    // Load textures and run application
    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        preference: 'webgl',
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (isDestroyed) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current!.appendChild(app.canvas);

      // Create layers
      const gridBg = new PIXI.Graphics();
      app.stage.addChild(gridBg);

      // Dummy Sprite
      const dummyContainer = new PIXI.Container();
      app.stage.addChild(dummyContainer);
      const dummySprite = new PIXI.Sprite();
      dummySprite.anchor.set(0.5);
      dummyContainer.addChild(dummySprite);

      // VFX container
      const vfxContainer = new PIXI.Container();
      app.stage.addChild(vfxContainer);

      let lastDummyUrl = '';
      let activeVfxSprites: PIXI.Sprite[] = [];
      let loadedUrls = new Set<string>();

      // Animation ticker loop
      app.ticker.add((ticker) => {
        if (!app.screen) return;
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;

        // Render reference grid
        gridBg.clear();
        gridBg.rect(0, 0, app.screen.width, app.screen.height);
        gridBg.fill({ color: 0x0f172a }); // slate-900

        gridBg.stroke({ color: 0x1e293b, width: 1 });
        const step = 40;
        for (let i = 0; i < app.screen.width; i += step) {
          gridBg.moveTo(i, 0).lineTo(i, app.screen.height);
        }
        for (let i = 0; i < app.screen.height; i += step) {
          gridBg.moveTo(0, i).lineTo(app.screen.width, i);
        }

        // Draw crosshair at center
        gridBg.moveTo(centerX - 20, centerY).lineTo(centerX + 20, centerY);
        gridBg.moveTo(centerX, centerY - 20).lineTo(centerX, centerY + 20);
        gridBg.stroke({ color: 0x334155, width: 2 });

        // Update target dummy
        dummyContainer.x = centerX;
        dummyContainer.y = centerY;
        if (lastDummyUrl !== activeDummy.url) {
          lastDummyUrl = activeDummy.url;
          PIXI.Assets.load(activeDummy.url).then((texture) => {
            if (!isDestroyed) {
              dummySprite.texture = texture;
              dummySprite.scale.set(0.5);
              dummySprite.alpha = 0.35; // keep it dim as a reference anchor
            }
          });
        }

        // Playback progress update
        const localConfig = configRef.current;
        const localVfx = localConfig?.default?.vfxAnimation;
        const duration = localVfx?.durationMs ?? 500;

        if (isPlayingRef.current) {
          const deltaSeconds = ticker.deltaTime / 60; // approx elapsed seconds in tick
          const speed = playSpeedRef.current;
          const increment = (deltaSeconds * 1000 * speed) / duration;
          const nextProgress = (progressRef.current + increment) % 1.0;
          progressRef.current = nextProgress;
          setProgress(nextProgress);
        }

        // Recreate sprites if the layer count changes
        const localLayers: VFXSpriteLayer[] = localVfx?.layers || [];
        if (activeVfxSprites.length !== localLayers.length) {
          activeVfxSprites.forEach((s) => vfxContainer.removeChild(s));
          activeVfxSprites = [];
          loadedUrls.clear();

          localLayers.forEach((layer, lIdx) => {
            const spr = new PIXI.Sprite();
            spr.anchor.set(0.5);
            vfxContainer.addChild(spr);
            activeVfxSprites.push(spr);
          });
        }

        // Render VFX layers
        vfxContainer.x = centerX;
        vfxContainer.y = centerY;

        localLayers.forEach((layer, lIdx) => {
          const spr = activeVfxSprites[lIdx];
          if (!spr) return;

          // Lazy load texture
          if (spr.label !== layer.url) {
            spr.label = layer.url;
            PIXI.Assets.load(layer.url).then((tex) => {
              if (!isDestroyed) spr.texture = tex;
            });
          }

          // Interpolation calculation
          const values = interpolateKeyframes(
            layer.keyframes,
            progressRef.current
          );
          const baseScale = localConfig?.default?.scale ?? 0.3;
          const ox = localConfig?.default?.offsetX ?? 0;
          const oy = localConfig?.default?.offsetY ?? 0;

          spr.x = ox + values.x;
          spr.y = oy + values.y;
          spr.anchor.set(layer.anchorX ?? 0.5, layer.anchorY ?? 0.5);
          spr.scale.set(baseScale * values.scaleX, baseScale * values.scaleY);
          spr.rotation = (values.rotation * Math.PI) / 180;
          spr.alpha = values.alpha;
        });
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
  }, [activeDummy.url, selectedKey]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col bg-slate-950 font-sans text-slate-100 select-none">
      <EditorSourceStatus source={source} onClose={onClose} />
      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-wide text-cyan-400 uppercase">
            VFX Animation Editor
          </h2>
          <div className="font-mono text-xs text-slate-500">{selectedKey}</div>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          ✕ Close
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* SIDEBAR LEFT: CONFIG MANAGEMENT & GLOBAL SETTINGS */}
        <div className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto border-r border-slate-800 bg-slate-900 p-4">
          {/* Select config */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              VFX Config Key
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {attackConfigs.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Create new config */}
          <div className="space-y-1.5 border-t border-slate-800 pt-2">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Create New VFX Config
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="attack_slash"
                value={newConfigId}
                onChange={(e) => setNewConfigId(e.target.value)}
                className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleCreateConfig}
                className="cursor-pointer rounded bg-cyan-900 px-3 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-800"
              >
                Create
              </button>
            </div>
          </div>

          {/* Global VFX settings */}
          <div className="space-y-3 border-t border-slate-800 pt-3">
            <label className="block text-xs font-bold tracking-wider text-cyan-400 uppercase">
              Global VFX Settings
            </label>

            {/* Duration */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duration</span>
                <span className="font-mono text-cyan-400">
                  {vfxAnimation?.durationMs ?? 500} ms
                </span>
              </div>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={vfxAnimation?.durationMs ?? 500}
                onChange={(e) =>
                  updateVfxConfig({
                    durationMs: parseInt(e.target.value) || 500,
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Base scale */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Base Scale</span>
                <span className="font-mono text-cyan-400">
                  {(currentConfig?.default?.scale ?? 0.3).toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={2.0}
                step={0.01}
                value={currentConfig?.default?.scale ?? 0.3}
                onChange={(e) =>
                  updateConfig({ scale: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Global offset x */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">VFX Offset X</span>
                <span className="font-mono text-cyan-400">
                  {currentConfig?.default?.offsetX ?? 0}px
                </span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={currentConfig?.default?.offsetX ?? 0}
                onChange={(e) =>
                  updateConfig({ offsetX: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Global offset y */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">VFX Offset Y</span>
                <span className="font-mono text-cyan-400">
                  {currentConfig?.default?.offsetY ?? 0}px
                </span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={currentConfig?.default?.offsetY ?? 0}
                onChange={(e) =>
                  updateConfig({ offsetY: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 space-y-2 border-t border-slate-800 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full cursor-pointer items-center justify-center rounded bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {saving ? 'Saving...' : 'Save to tdConfigs.ts'}
            </button>
            {statusMsg && (
              <p className="text-center text-xs font-semibold text-emerald-400">
                {statusMsg}
              </p>
            )}
          </div>
        </div>

        {/* TIMELINE & LAYER CONTROLS (MIDDLE PANEL) */}
        <div className="flex min-h-0 w-96 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900">
          {/* Layer manager */}
          <div className="flex flex-col space-y-3 border-b border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                VFX Sprite Layers
              </h3>
              <button
                onClick={handleAddLayer}
                className="cursor-pointer rounded bg-cyan-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-cyan-600"
              >
                + Add Layer
              </button>
            </div>

            {/* List layers */}
            {layers.length === 0 ? (
              <p className="rounded border border-slate-800 bg-slate-950/40 p-2 text-center text-xs text-slate-500 italic">
                No sprite layers. Click "+ Add Layer" to start.
              </p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {layers.map((layer, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveLayerIndex(idx);
                      setActiveKeyframeIndex(0);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded border p-2 font-mono text-xs transition ${
                      activeLayerIndex === idx
                        ? 'border-cyan-800 bg-cyan-950/60 text-cyan-200'
                        : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate pr-2 select-none">
                      #{idx + 1}: {layer.url.split('/').pop()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(idx);
                      }}
                      className="cursor-pointer rounded px-1 text-[10px] font-semibold text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Layer Details */}
          {activeLayer && (
            <div className="space-y-4 p-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Sprite Image Source
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={activeLayer.url}
                    onChange={(e) => updateActiveLayer({ url: e.target.value })}
                    className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                  >
                    {BATTLE_SPRITES.map((url) => (
                      <option key={url} value={url}>
                        {url.split('/').pop()}
                      </option>
                    ))}
                    {!BATTLE_SPRITES.includes(activeLayer.url) && (
                      <option value={activeLayer.url}>
                        {activeLayer.url.split('/').pop()} (Custom)
                      </option>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="/battles/attacks/custom.webp"
                    value={activeLayer.url}
                    onChange={(e) => updateActiveLayer({ url: e.target.value })}
                    className="w-1/2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {(['anchorX', 'anchorY'] as const).map((field) => (
                  <label key={field} className="flex-1 text-xs text-slate-400">
                    Pivot {field === 'anchorX' ? 'X' : 'Y'}
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={activeLayer[field] ?? 0.5}
                      onChange={(e) =>
                        updateActiveLayer({
                          [field]: Math.max(
                            0,
                            Math.min(1, Number(e.target.value))
                          ),
                        })
                      }
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300"
                    />
                  </label>
                ))}
              </div>

              {/* Timeline Section */}
              <div className="space-y-2 border-t border-slate-800 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Keyframes Timeline
                  </label>
                  <button
                    onClick={handleAddKeyframe}
                    className="cursor-pointer rounded bg-cyan-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-cyan-600"
                  >
                    + Add Keyframe
                  </button>
                </div>

                {/* Timeline Scrubber visualization */}
                <div className="relative flex h-14 items-center overflow-hidden rounded border border-slate-800 bg-slate-950 px-4 shadow-inner">
                  {/* Timeline bar */}
                  <div className="absolute right-4 left-4 h-1.5 rounded-full bg-slate-800" />

                  {/* Current playhead marker */}
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-cyan-400"
                    style={{ left: `calc(${progress * 100}% * 0.92 + 4%)` }}
                  />

                  {/* Render Keyframe dot anchors */}
                  {keyframes.map((kf, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveKeyframeIndex(index)}
                      className={`absolute h-3.5 w-3.5 -translate-x-1.75 transform cursor-pointer rounded-full shadow-md transition-all ${
                        activeKeyframeIndex === index
                          ? 'scale-125 border-2 border-white bg-cyan-400 ring-2 ring-cyan-500/50'
                          : 'border border-slate-700 bg-slate-500 hover:bg-slate-300'
                      }`}
                      style={{
                        left: `calc(${kf.progress * 100}% * 0.92 + 4%)`,
                      }}
                      title={`Keyframe @ ${Math.round(kf.progress * 100)}%`}
                    />
                  ))}
                </div>

                {/* Simple List of Keyframes */}
                <div className="flex flex-wrap gap-1 pr-1">
                  {keyframes.map((kf, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveKeyframeIndex(index)}
                      className={`cursor-pointer rounded border px-2 py-1 font-mono text-[10px] transition ${
                        activeKeyframeIndex === index
                          ? 'border-cyan-700 bg-cyan-900 text-cyan-200'
                          : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {Math.round(kf.progress * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Keyframe Property Editor */}
              {activeKeyframe ? (
                <div className="space-y-3.5 rounded border border-slate-800 bg-slate-950 p-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold tracking-wide text-cyan-400 uppercase">
                      Keyframe Editor @{' '}
                      {Math.round(activeKeyframe.progress * 100)}%
                    </span>
                    <button
                      onClick={handleDeleteKeyframe}
                      className="cursor-pointer text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Scrubber Time */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Timeline Position</span>
                      <span className="font-mono text-cyan-400">
                        {Math.round(activeKeyframe.progress * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(activeKeyframe.progress * 100)}
                      onChange={(e) =>
                        updateActiveKeyframe({
                          progress: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Offset X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>X Offset (Pixels)</span>
                      <span className="font-mono text-cyan-400">
                        {activeKeyframe.x ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      step={1}
                      value={activeKeyframe.x ?? 0}
                      onChange={(e) =>
                        updateActiveKeyframe({ x: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Offset Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Y Offset (Pixels)</span>
                      <span className="font-mono text-cyan-400">
                        {activeKeyframe.y ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      step={1}
                      value={activeKeyframe.y ?? 0}
                      onChange={(e) =>
                        updateActiveKeyframe({ y: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Scale X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale X Multiplier</span>
                      <span className="font-mono text-cyan-400">
                        {(activeKeyframe.scaleX ?? 1).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={activeKeyframe.scaleX ?? 1}
                      onChange={(e) =>
                        updateActiveKeyframe({ scaleX: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Scale Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale Y Multiplier</span>
                      <span className="font-mono text-cyan-400">
                        {(activeKeyframe.scaleY ?? 1).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={activeKeyframe.scaleY ?? 1}
                      onChange={(e) =>
                        updateActiveKeyframe({ scaleY: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Rotation (Degrees)</span>
                      <span className="font-mono text-cyan-400">
                        {activeKeyframe.rotation ?? 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-360}
                      max={360}
                      step={5}
                      value={activeKeyframe.rotation ?? 0}
                      onChange={(e) =>
                        updateActiveKeyframe({
                          rotation: Number(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Alpha */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Alpha Opacity</span>
                      <span className="font-mono text-cyan-400">
                        {Math.round((activeKeyframe.alpha ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      value={activeKeyframe.alpha ?? 1}
                      onChange={(e) =>
                        updateActiveKeyframe({ alpha: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded border border-slate-800 bg-slate-950 p-3 text-center text-xs text-slate-500 italic">
                  Select a keyframe on the timeline above to edit its visual
                  properties
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE PIXI PREVIEW */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-slate-950">
          {/* Controls toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Preview Target:
              </span>
              <select
                value={selectedDummyId}
                onChange={(e) => setSelectedDummyId(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                {TARGET_DUMMIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Playback speed */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Playback Speed:
              </span>
              <div className="flex overflow-hidden rounded border border-slate-700 bg-slate-950 p-0.5">
                {[0.1, 0.25, 0.5, 1.0, 2.0].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaySpeed(speed)}
                    className={`cursor-pointer rounded-sm px-2 py-0.5 font-mono text-[10px] transition ${
                      playSpeed === speed
                        ? 'bg-cyan-850 font-bold text-cyan-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pixi Canvas mount */}
          <div className="relative flex-1 overflow-hidden">
            <div ref={containerRef} className="absolute inset-0" />

            {/* Guide overlay labels */}
            <div className="pointer-events-none absolute top-3 left-3 rounded border border-slate-800 bg-black/60 px-2 py-1 text-[10px] text-slate-400 select-none">
              Crosshair indicates target creature focal point. Target dummy
              shown at 35% opacity.
            </div>
          </div>

          {/* Bottom scrubber controls */}
          <div className="flex shrink-0 items-center gap-4 border-t border-slate-800 bg-slate-900 p-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex w-20 cursor-pointer items-center justify-center rounded py-2 text-xs font-bold text-white shadow transition ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            {/* Progress scrubber bar */}
            <div className="flex flex-1 items-center gap-3">
              <span className="font-mono text-[10px] text-slate-500">0%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(progress * 100)}
                onChange={(e) => {
                  setIsPlaying(false);
                  const nextP = Number(e.target.value) / 100;
                  setProgress(nextP);
                  progressRef.current = nextP;
                }}
                className="h-2 flex-1 rounded-full border border-slate-800 bg-slate-950 accent-cyan-400"
              />
              <span className="font-mono text-[10px] text-slate-500">100%</span>
            </div>

            {/* Scrubber time readout */}
            <div className="shrink-0 text-right">
              <div className="font-mono text-sm font-bold text-cyan-400">
                {Math.round(progress * 100)}%
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {Math.round(progress * (vfxAnimation?.durationMs ?? 500))} ms
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
