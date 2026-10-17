'use client';

import { SpeciesId } from '@/types/definitionIds';

import { useState, useEffect, useMemo } from 'react';
import { useEditorSource } from './useEditorSource';
import EditorSourceStatus from './EditorSourceStatus';
import { ANIMATIONS } from '@/constants/animations';
import { SENTICLE } from '@/constants/creatures';
import {
  AnimationDefinition,
  AnimationKeyframe,
  AnimationMap,
} from '@/types/animation';
import { generateKeyframesCss } from '@/utils/animationUtils';

import * as allCreatures from '@/constants/creatures';

// --- Helpers ---
const DEFAULT_KEYFRAME: AnimationKeyframe = {
  percent: 0,
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 },
};

const DEFAULT_ANIMATION: AnimationDefinition = {
  id: 'new_animation',
  name: 'New Animation',
  duration: 1,
  easing: 'linear',
  keyframes: [
    { ...DEFAULT_KEYFRAME, percent: 0 },
    { ...DEFAULT_KEYFRAME, percent: 100 },
  ],
};

// --- Components ---

function KeyframeTimeline({
  keyframes,
  selectedPercent,
  onSelect,
  onAdd,
  onDelete,
}: {
  keyframes: AnimationKeyframe[];
  selectedPercent: number | null;
  onSelect: (percent: number) => void;
  onAdd: () => void;
  onDelete: (percent: number) => void;
}) {
  // Sort for display
  const sorted = [...keyframes].sort((a, b) => a.percent - b.percent);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Timeline
        </label>
        <button
          onClick={onAdd}
          className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600"
        >
          + Add Keyframe
        </button>
      </div>
      <div className="relative flex h-12 w-full items-center rounded bg-slate-800 px-4">
        <div className="absolute top-1/2 right-4 left-4 h-1 -translate-y-1/2 bg-slate-700" />
        {sorted.map((kf) => (
          <div
            key={kf.percent}
            className={`absolute h-3 w-3 -translate-x-1.5 transform cursor-pointer rounded-full transition-all ${
              selectedPercent === kf.percent
                ? 'scale-125 border border-white bg-cyan-400'
                : 'bg-slate-400 hover:bg-slate-200'
            }`}
            style={{ left: `calc(${kf.percent}% * 0.94 + 3%)` }} // basic visual adjustment
            onClick={() => onSelect(kf.percent)}
            title={`${kf.percent}%`}
          />
        ))}
      </div>
    </div>
  );
}

// --- Main Editor ---

export default function AnimationEditor({ onClose }: { onClose: () => void }) {
  // State
  const [animations, setAnimations] = useState(() =>
    structuredClone(ANIMATIONS)
  );
  const source = useEditorSource<AnimationMap>(
    'animations',
    'ANIMATIONS',
    (config) => {
      setAnimations(config);
      setIsDirty(false);
    }
  );
  const [selectedAnimId, setSelectedAnimId] = useState<string | null>(null);
  const [selectedCreatureId, setSelectedCreatureId] = useState<SpeciesId>(
    SENTICLE.id
  );
  const [selectedPercent, setSelectedPercent] = useState<number | null>(0);
  const [renderVersion, setRenderVersion] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Derived
  const activeAnim = selectedAnimId ? animations[selectedAnimId] : null;

  const creatureList = useMemo(() => {
    return Object.values(allCreatures).filter(
      (c): c is import('@/types/baseGame').CosmoidTemplate =>
        typeof c === 'object' && c !== null && 'baseStats' in c
    );
  }, []);

  const activeCreature = creatureList.find((c) => c.id === selectedCreatureId);
  const activeKeyframe = activeAnim?.keyframes.find(
    (k) => k.percent === selectedPercent
  );

  // Live CSS Injection for Preview
  useEffect(() => {
    if (!activeAnim) return;
    // Hack to force browser to pick up new keyframes: version the name
    const versionedId = `anim-${activeAnim.id}-${renderVersion}`;
    const rawCss = generateKeyframesCss(activeAnim);
    // Replace the standard name with versioned name in the CSS string
    const css = rawCss.replaceAll(`anim-${activeAnim.id}`, versionedId);

    const styleId = 'preview-animation-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = css;
  }, [activeAnim, renderVersion]);

  // Handlers
  const ensureUniqueId = (baseId: string) => {
    let id = baseId;
    let counter = 1;
    while (animations[id]) {
      id = `${baseId}_${counter}`;
      counter++;
    }
    return id;
  };

  const handleCreate = () => {
    const id = ensureUniqueId('new_anim');
    const newAnim = { ...DEFAULT_ANIMATION, id, name: id };
    setAnimations({ ...animations, [id]: newAnim });
    setSelectedAnimId(id);
    setIsDirty(true);
    setRenderVersion(0);
  };

  const updateAnim = (updates: Partial<AnimationDefinition>) => {
    if (!activeAnim) return;
    const updated = { ...activeAnim, ...updates };
    setAnimations({ ...animations, [activeAnim.id]: updated });
    setIsDirty(true);
    setRenderVersion((v) => v + 1);
  };

  const updateKeyframe = (updates: Partial<AnimationKeyframe['transform']>) => {
    if (!activeAnim || selectedPercent === null) return;
    const newKeyframes = activeAnim.keyframes.map((kf) => {
      if (kf.percent === selectedPercent) {
        return { ...kf, transform: { ...kf.transform, ...updates } };
      }
      return kf;
    });
    updateAnim({ keyframes: newKeyframes });
  };

  const addKeyframe = () => {
    if (!activeAnim) return;
    // Find a gap? Or just add 50% if missing, otherwise defaults
    const exists = (p: number) =>
      activeAnim.keyframes.some((k) => k.percent === p);
    let target = 50;
    if (exists(50)) target = 25;
    if (exists(25)) target = 75;

    // Fallback: finding first integer gap is overkill, just prompt or smart defaults
    if (exists(target)) {
      // simple random fallback
      target = Math.floor(Math.random() * 100);
    }

    const newKeyframes = [
      ...activeAnim.keyframes,
      { ...DEFAULT_KEYFRAME, percent: target },
    ];
    updateAnim({ keyframes: newKeyframes });
    setSelectedPercent(target);
  };

  const deleteKeyframe = () => {
    if (!activeAnim || selectedPercent === null) return;
    if (activeAnim.keyframes.length <= 1) return; // prevent empty
    const newKeyframes = activeAnim.keyframes.filter(
      (k) => k.percent !== selectedPercent
    );
    updateAnim({ keyframes: newKeyframes });
    setSelectedPercent(newKeyframes[0].percent);
  };

  const handleSave = async () => {
    try {
      await source.save('/api/animations/save', { animations }, animations);
      setIsDirty(false);
      alert('Saved!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error saving');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 font-sans text-white backdrop-blur">
      <EditorSourceStatus source={source} onClose={onClose} />
      <div className="flex h-full w-full overflow-hidden">
        {/* SIDEBAR */}
        <div className="flex w-64 flex-col border-r border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-3">
            <h2 className="text-sm font-bold text-slate-300">Animations</h2>
            <div className="flex gap-1">
              <button
                onClick={handleCreate}
                className="rounded bg-cyan-700 px-2 py-1 text-xs hover:bg-cyan-600"
              >
                + New
              </button>
              <button onClick={onClose} className="px-2 text-slate-500">
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {Object.values(animations).map((anim) => (
              <button
                key={anim.id}
                onClick={() => {
                  if (isDirty && !confirm('Discard unsaved changes?')) return;
                  setSelectedAnimId(anim.id);
                  setSelectedPercent(0);
                  setIsDirty(false); // In a real app we'd checking diffs, here we reset "session is dirty" if switching? Actually let's keep isDirty global for the whole map.
                  // Actually, if we switch we don't lose data because `animations` state holds it.
                  // So we don't need to warn.
                }}
                className={`mb-1 w-full rounded px-3 py-2 text-left font-mono text-xs ${
                  selectedAnimId === anim.id
                    ? 'bg-cyan-900 text-cyan-100'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {anim.name || anim.id}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-800 p-2">
            <button
              onClick={handleSave}
              className={`w-full rounded py-2 text-xs font-bold ${
                isDirty
                  ? 'bg-green-600 text-white hover:bg-green-500'
                  : 'bg-slate-800 text-slate-500'
              }`}
              disabled={!isDirty}
            >
              {isDirty ? 'Save Changes' : 'No Changes'}
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        {activeAnim ? (
          <div className="flex flex-1 gap-0">
            {/* MIDDLE: Properties */}
            <div className="flex w-80 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase">
                Properties
              </h3>

              {/* General Settings */}
              <div className="mb-6 space-y-3 rounded border border-slate-700 bg-slate-800 p-3">
                <label className="text-xs font-bold text-cyan-400 uppercase">
                  Global Settings
                </label>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">
                    ID (Unique)
                  </label>
                  <input
                    value={activeAnim.id}
                    onChange={(e) => {
                      // Rename key in map
                      const newId = e.target.value;
                      if (animations[newId]) return; // prevent collision
                      const { [activeAnim.id]: current, ...rest } = animations;
                      const newAnim = { ...current, id: newId };
                      setAnimations({ ...rest, [newId]: newAnim });
                      setSelectedAnimId(newId);
                      setIsDirty(true);
                    }}
                    className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">
                    Duration (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={activeAnim.duration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateAnim({ duration: isNaN(val) ? 0 : val });
                    }}
                    className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">
                    Easing
                  </label>
                  <select
                    value={activeAnim.easing}
                    onChange={(e) => updateAnim({ easing: e.target.value })}
                    className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs"
                  >
                    <option value="linear">linear</option>
                    <option value="ease">ease</option>
                    <option value="ease-in">ease-in</option>
                    <option value="ease-out">ease-out</option>
                    <option value="ease-in-out">ease-in-out</option>
                  </select>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <KeyframeTimeline
                  keyframes={activeAnim.keyframes}
                  selectedPercent={selectedPercent}
                  onSelect={setSelectedPercent}
                  onAdd={addKeyframe}
                  onDelete={deleteKeyframe}
                />
              </div>

              {/* Keyframe Editor */}
              {activeKeyframe ? (
                <div className="space-y-3 rounded border border-slate-700 bg-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-400 uppercase">
                      Keyframe @ {activeKeyframe.percent}%
                    </label>
                    <button
                      onClick={deleteKeyframe}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Scale X
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={activeKeyframe.transform.scaleX ?? 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateKeyframe({ scaleX: isNaN(val) ? 1 : val });
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Scale Y
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={activeKeyframe.transform.scaleY ?? 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateKeyframe({ scaleY: isNaN(val) ? 1 : val });
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Translate Y
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={activeKeyframe.transform.y ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateKeyframe({ y: isNaN(val) ? 0 : val });
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Translate X
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={activeKeyframe.transform.x ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateKeyframe({ x: isNaN(val) ? 0 : val });
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Rotate (deg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={activeKeyframe.transform.rotate ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateKeyframe({ rotate: isNaN(val) ? 0 : val });
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">
                        Time (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={activeKeyframe.percent}
                        onChange={(e) => {
                          // Change percent logic is tricky because of ID
                          // simpler to just update value, but need to check collision
                          const p = parseInt(e.target.value);
                          if (isNaN(p)) return; // Don't allow clearing percent to empty/NaN as it breaks ID
                          if (activeAnim.keyframes.some((k) => k.percent === p))
                            return; // collision
                          // update
                          const newKeyframes = activeAnim.keyframes.map((k) =>
                            k.percent === activeKeyframe.percent
                              ? { ...k, percent: p }
                              : k
                          );
                          updateAnim({ keyframes: newKeyframes });
                          setSelectedPercent(p);
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Select a keyframe
                </div>
              )}
            </div>

            {/* RIGHT: Preview */}
            <div className="flex flex-1 flex-col bg-black/50">
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <h3 className="text-xs font-bold text-slate-400">Preview</h3>
                <select
                  value={selectedCreatureId}
                  onChange={(e) =>
                    setSelectedCreatureId(Number(e.target.value))
                  }
                  className="w-48 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                >
                  {creatureList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[url('/battle-backgrounds/shores_of_eternity.png')] bg-cover bg-center">
                {/* Creature */}
                {activeCreature && (
                  <div
                    className={`transform transition-all animate-${activeAnim.id}`}
                    style={{
                      animationDuration: `${activeAnim.duration}s`,
                      animationTimingFunction: activeAnim.easing,
                      animationName: `anim-${activeAnim.id}-${renderVersion}`,
                    }}
                  >
                    <img
                      src={
                        activeCreature.battleSpriteUrl ||
                        activeCreature.spriteUrl
                      }
                      alt="preview"
                      className="h-64 object-contain drop-shadow-2xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            Select an animation to edit
          </div>
        )}
      </div>
    </div>
  );
}
