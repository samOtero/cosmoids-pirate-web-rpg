'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import * as CREATURES from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { interpolateKeyframes } from '@/utils/animationUtils';
import { VFXSpriteKeyframe, VFXSpriteLayer, VFXAnimationConfig } from '@/types/baseGame';

const BATTLE_SPRITES = [
  '/battles/attacks/nibble_top_teeth.webp',
  '/battles/attacks/nibble_bottom_teeth.webp',
  '/battles/attacks/scratch.webp',
];

const TARGET_DUMMIES = [
  { id: 'senticle', name: 'Senticle', url: '/battles/cosmoids/senticle_left_1.webp' },
  { id: 'starter_crab', name: 'Palmit (Crab)', url: '/battles/cosmoids/palmit_down_1.webp' },
  { id: 'starter_iguana', name: 'Fueguana (Iguana)', url: '/battles/cosmoids/fueguana_left_1_v3.webp' },
  { id: 'starter_monkey', name: 'Monkeg (Monkey)', url: '/battles/cosmoids/monkeg_down_1_v2.webp' },
  { id: 'mouse_1', name: 'Mouse', url: '/battles/cosmoids/mouse_1_left_1_25.webp' },
];

export default function TDEffectEditor({ onClose }: { onClose: () => void }) {
  const allConfigs = useMemo(() => {
    return Object.keys(CREATURE_TD_CONFIGS);
  }, []);

  const attackConfigs = useMemo(() => {
    return allConfigs.filter((key) => key.startsWith('attack_'));
  }, [allConfigs]);

  const [selectedKey, setSelectedKey] = useState<string>(attackConfigs[0] || 'attack_nibble_1');
  const [newConfigId, setNewConfigId] = useState<string>('');

  // Load configuration
  const [currentConfig, setCurrentConfig] = useState<any>(null);

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
            layers: []
          }
        }
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

  const activeDummy = TARGET_DUMMIES.find((d) => d.id === selectedDummyId) || TARGET_DUMMIES[0];

  // Helper updates
  const updateConfig = (updates: any) => {
    setCurrentConfig((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.default = {
        ...(next.default || {}),
        ...updates
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
          ...(next.default?.vfxAnimation || { type: 'KEYFRAME_SPRITES', durationMs: 500, layers: [] }),
          ...updates
        }
      };
      return next;
    });
  };

  // Get safe active references
  const vfxAnimation = currentConfig?.default?.vfxAnimation;
  const layers: VFXSpriteLayer[] = vfxAnimation?.layers || [];
  const activeLayer: VFXSpriteLayer | undefined = layers[activeLayerIndex];
  const keyframes: VFXSpriteKeyframe[] = activeLayer?.keyframes || [];
  const activeKeyframe: VFXSpriteKeyframe | undefined = keyframes[activeKeyframeIndex];

  // Layer modifiers
  const handleAddLayer = () => {
    if (!currentConfig) return;
    const newLayer: VFXSpriteLayer = {
      url: '/battles/attacks/scratch.webp',
      keyframes: [
        { progress: 0.0, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 },
        { progress: 1.0, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 0 }
      ]
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
      alert(`A keyframe already exists near ${Math.round(targetProgress * 100)}%`);
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
      alpha: Math.round(interpolated.alpha * 100) / 100
    };

    const nextKeyframes = [...keyframes, newKf].sort((a, b) => a.progress - b.progress);
    updateActiveLayer({ keyframes: nextKeyframes });
    
    const newIdx = nextKeyframes.findIndex((k) => k.progress === targetProgress);
    if (newIdx !== -1) {
      setActiveKeyframeIndex(newIdx);
    }
  };

  const handleDeleteKeyframe = () => {
    if (keyframes.length <= 1) {
      alert("Animations must have at least one keyframe!");
      return;
    }
    const nextKeyframes = keyframes.filter((_, idx) => idx !== activeKeyframeIndex);
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
    const cleanId = newConfigId.startsWith('attack_') ? newConfigId.trim() : `attack_${newConfigId.trim()}`;
    if (allConfigs.includes(cleanId)) {
      alert("This Config ID already exists!");
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
      const res = await fetch('/api/dev/save-creature-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatureId: selectedKey,
          tdConfig: currentConfig,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Saved ${selectedKey}!`);
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setStatusMsg('Network error');
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
          const values = interpolateKeyframes(layer.keyframes, progressRef.current);
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
    <div className="fixed inset-0 z-9999 flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-cyan-400 tracking-wide uppercase">
            VFX Animation Editor
          </h2>
          <div className="text-xs text-slate-500 font-mono">
            {selectedKey}
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition text-sm cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR LEFT: CONFIG MANAGEMENT & GLOBAL SETTINGS */}
        <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Select config */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              VFX Config Key
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {attackConfigs.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Create new config */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Create New VFX Config
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="attack_slash"
                value={newConfigId}
                onChange={(e) => setNewConfigId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleCreateConfig}
                className="bg-cyan-900 text-cyan-200 hover:bg-cyan-800 px-3 py-1 rounded text-xs font-bold transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>

          {/* Global VFX settings */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase text-cyan-400 tracking-wider block">
              Global VFX Settings
            </label>

            {/* Duration */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duration</span>
                <span className="font-mono text-cyan-400">{(vfxAnimation?.durationMs ?? 500)} ms</span>
              </div>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={vfxAnimation?.durationMs ?? 500}
                onChange={(e) => updateVfxConfig({ durationMs: parseInt(e.target.value) || 500 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Base scale */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Base Scale</span>
                <span className="font-mono text-cyan-400">{(currentConfig?.default?.scale ?? 0.3).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={2.0}
                step={0.01}
                value={currentConfig?.default?.scale ?? 0.3}
                onChange={(e) => updateConfig({ scale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Global offset x */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">VFX Offset X</span>
                <span className="font-mono text-cyan-400">{(currentConfig?.default?.offsetX ?? 0)}px</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={currentConfig?.default?.offsetX ?? 0}
                onChange={(e) => updateConfig({ offsetX: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Global offset y */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">VFX Offset Y</span>
                <span className="font-mono text-cyan-400">{(currentConfig?.default?.offsetY ?? 0)}px</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={currentConfig?.default?.offsetY ?? 0}
                onChange={(e) => updateConfig({ offsetY: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 px-4 py-2.5 rounded text-sm font-bold text-white transition flex items-center justify-center cursor-pointer shadow-lg"
            >
              {saving ? 'Saving...' : 'Save to tdConfigs.ts'}
            </button>
            {statusMsg && (
              <p className="text-xs text-center text-emerald-400 font-semibold">{statusMsg}</p>
            )}
          </div>
        </div>

        {/* TIMELINE & LAYER CONTROLS (MIDDLE PANEL) */}
        <div className="w-96 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0 overflow-y-auto">
          {/* Layer manager */}
          <div className="p-4 border-b border-slate-800 flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                VFX Sprite Layers
              </h3>
              <button
                onClick={handleAddLayer}
                className="text-[10px] bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded text-white font-bold cursor-pointer"
              >
                + Add Layer
              </button>
            </div>

            {/* List layers */}
            {layers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800 text-center">
                No sprite layers. Click "+ Add Layer" to start.
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {layers.map((layer, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveLayerIndex(idx);
                      setActiveKeyframeIndex(0);
                    }}
                    className={`flex items-center justify-between p-2 rounded text-xs font-mono border transition cursor-pointer
                      ${activeLayerIndex === idx
                        ? 'bg-cyan-950/60 border-cyan-800 text-cyan-200'
                        : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-800/40'
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
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold px-1 rounded cursor-pointer"
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
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Sprite Image Source
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={activeLayer.url}
                    onChange={(e) => updateActiveLayer({ url: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
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
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
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
                      onChange={(e) => updateActiveLayer({ [field]: Math.max(0, Math.min(1, Number(e.target.value))) })}
                      className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300"
                    />
                  </label>
                ))}
              </div>

              {/* Timeline Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Keyframes Timeline
                  </label>
                  <button
                    onClick={handleAddKeyframe}
                    className="text-[10px] bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded text-white font-bold cursor-pointer"
                  >
                    + Add Keyframe
                  </button>
                </div>

                {/* Timeline Scrubber visualization */}
                <div className="relative h-14 bg-slate-950 rounded border border-slate-800 flex items-center px-4 overflow-hidden shadow-inner">
                  {/* Timeline bar */}
                  <div className="absolute left-4 right-4 h-1.5 bg-slate-800 rounded-full" />
                  
                  {/* Current playhead marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-10"
                    style={{ left: `calc(${progress * 100}% * 0.92 + 4%)` }}
                  />

                  {/* Render Keyframe dot anchors */}
                  {keyframes.map((kf, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveKeyframeIndex(index)}
                      className={`absolute w-3.5 h-3.5 rounded-full cursor-pointer transform -translate-x-1.75 transition-all shadow-md
                        ${activeKeyframeIndex === index
                          ? 'bg-cyan-400 scale-125 border-2 border-white ring-2 ring-cyan-500/50'
                          : 'bg-slate-500 border border-slate-700 hover:bg-slate-300'
                        }`}
                      style={{ left: `calc(${kf.progress * 100}% * 0.92 + 4%)` }}
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
                      className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition border
                        ${activeKeyframeIndex === index
                          ? 'bg-cyan-900 border-cyan-700 text-cyan-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                    >
                      {Math.round(kf.progress * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Keyframe Property Editor */}
              {activeKeyframe ? (
                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-3.5 shadow-inner">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                      Keyframe Editor @ {Math.round(activeKeyframe.progress * 100)}%
                    </span>
                    <button
                      onClick={handleDeleteKeyframe}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Scrubber Time */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Timeline Position</span>
                      <span className="font-mono text-cyan-400">{Math.round(activeKeyframe.progress * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(activeKeyframe.progress * 100)}
                      onChange={(e) => updateActiveKeyframe({ progress: Number(e.target.value) / 100 })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Offset X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>X Offset (Pixels)</span>
                      <span className="font-mono text-cyan-400">{(activeKeyframe.x ?? 0)}px</span>
                    </div>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      step={1}
                      value={activeKeyframe.x ?? 0}
                      onChange={(e) => updateActiveKeyframe({ x: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Offset Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Y Offset (Pixels)</span>
                      <span className="font-mono text-cyan-400">{(activeKeyframe.y ?? 0)}px</span>
                    </div>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      step={1}
                      value={activeKeyframe.y ?? 0}
                      onChange={(e) => updateActiveKeyframe({ y: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Scale X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale X Multiplier</span>
                      <span className="font-mono text-cyan-400">{(activeKeyframe.scaleX ?? 1).toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={activeKeyframe.scaleX ?? 1}
                      onChange={(e) => updateActiveKeyframe({ scaleX: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Scale Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale Y Multiplier</span>
                      <span className="font-mono text-cyan-400">{(activeKeyframe.scaleY ?? 1).toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={activeKeyframe.scaleY ?? 1}
                      onChange={(e) => updateActiveKeyframe({ scaleY: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Rotation (Degrees)</span>
                      <span className="font-mono text-cyan-400">{(activeKeyframe.rotation ?? 0)}°</span>
                    </div>
                    <input
                      type="range"
                      min={-360}
                      max={360}
                      step={5}
                      value={activeKeyframe.rotation ?? 0}
                      onChange={(e) => updateActiveKeyframe({ rotation: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Alpha */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Alpha Opacity</span>
                      <span className="font-mono text-cyan-400">{Math.round((activeKeyframe.alpha ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      value={activeKeyframe.alpha ?? 1}
                      onChange={(e) => updateActiveKeyframe({ alpha: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-slate-500 italic bg-slate-950 rounded text-center border border-slate-800">
                  Select a keyframe on the timeline above to edit its visual properties
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE PIXI PREVIEW */}
        <div className="flex-1 flex flex-col bg-slate-950 min-w-0 relative">
          {/* Controls toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Preview Target:</span>
              <select
                value={selectedDummyId}
                onChange={(e) => setSelectedDummyId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
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
              <span className="text-slate-400 text-[10px] font-bold uppercase">Playback Speed:</span>
              <div className="flex bg-slate-950 border border-slate-700 rounded p-0.5 overflow-hidden">
                {[0.1, 0.25, 0.5, 1.0, 2.0].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaySpeed(speed)}
                    className={`px-2 py-0.5 rounded-sm font-mono text-[10px] transition cursor-pointer
                      ${playSpeed === speed
                        ? 'bg-cyan-850 text-cyan-200 font-bold'
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
          <div className="flex-1 relative overflow-hidden">
            <div ref={containerRef} className="absolute inset-0" />
            
            {/* Guide overlay labels */}
            <div className="absolute top-3 left-3 bg-black/60 border border-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded pointer-events-none select-none">
              Crosshair indicates target creature focal point. Target dummy shown at 35% opacity.
            </div>
          </div>

          {/* Bottom scrubber controls */}
          <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-20 py-2 rounded text-xs font-bold text-white transition cursor-pointer flex items-center justify-center shadow
                ${isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            {/* Progress scrubber bar */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-500">0%</span>
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
                className="flex-1 accent-cyan-400 h-2 bg-slate-950 border border-slate-800 rounded-full"
              />
              <span className="text-[10px] font-mono text-slate-500">100%</span>
            </div>

            {/* Scrubber time readout */}
            <div className="text-right shrink-0">
              <div className="font-mono text-sm font-bold text-cyan-400">
                {Math.round(progress * 100)}%
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {Math.round(progress * (vfxAnimation?.durationMs ?? 500))} ms
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
