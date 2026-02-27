import React, { useState, useEffect } from 'react';
import CutscenePixiPreview from './CutscenePixiPreview';
import CutsceneTimeline from './CutsceneTimeline';
import { CutsceneData, CutsceneKeyframe } from '@/types/cutscene';
import { BackgroundImageKey } from '@/types/baseGame';
import * as CreaturesMap from '@/constants/creatures';

const CREATURES_RECORD = Object.values(CreaturesMap).reduce(
  (acc, c) => {
    if (c && c.id) acc[c.id] = c;
    return acc;
  },
  {} as Record<string, any>
);

const BACKGROUND_OPTIONS = Object.values(BackgroundImageKey);

export default function CutsceneEditor({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<CutsceneData>({
    id: crypto.randomUUID(),
    name: 'NewCutscene',
    backgroundKey: BackgroundImageKey.FOREST,
    durationMs: 5000,
    units: [],
  });

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Playback Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (isPlaying) {
        const delta = time - lastTime;
        setCurrentTimeMs((prev) => {
          let next = prev + delta;
          if (next >= data.durationMs) {
            next = 0; // loop
          }
          return next;
        });
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, data.durationMs]);

  const handleSave = async () => {
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/dev/cutscenes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutsceneName: data.name.replace(/[^a-zA-Z0-9_]/g, ''),
          data: data,
        }),
      });
      if (res.ok) {
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('Error saving');
      }
    } catch (e) {
      setSaveStatus('Error saving');
    }
  };

  const addUnit = (speciesId: string) => {
    const defaultScale =
      CREATURES_RECORD[speciesId]?.battleScale ||
      CREATURES_RECORD[speciesId]?.tdSpriteScale ||
      1;

    setData({
      ...data,
      units: [
        ...data.units,
        {
          id: crypto.randomUUID(),
          speciesId,
          keyframes: [
            {
              timeMs: 0,
              x: 400,
              y: 225,
              scale: defaultScale,
              facingRight: true,
              opacity: 1,
            },
          ],
        },
      ],
    });
  };

  const updateKeyframe = (
    unitId: string,
    updates: Partial<CutsceneKeyframe>
  ) => {
    setData((prev) => {
      const newUnits = [...prev.units];
      const unitIndex = newUnits.findIndex((u) => u.id === unitId);
      if (unitIndex === -1) return prev;

      const unit = newUnits[unitIndex];
      const kfIndex = unit.keyframes.findIndex(
        (k) => k.timeMs === currentTimeMs
      );

      if (kfIndex === -1) {
        // Auto-spawn a keyframe if dragging on a frame without one
        const currentDataKp =
          unit.keyframes.length > 0
            ? unit.keyframes[0]
            : { scale: 1, opacity: 1, facingRight: true };
        const newKf: CutsceneKeyframe = {
          timeMs: currentTimeMs,
          x: updates.x ?? 400,
          y: updates.y ?? 225,
          scale: updates.scale ?? currentDataKp.scale,
          opacity: updates.opacity ?? currentDataKp.opacity,
          facingRight: updates.facingRight ?? currentDataKp.facingRight,
        };
        newUnits[unitIndex] = {
          ...unit,
          keyframes: [...unit.keyframes, newKf].sort(
            (a, b) => a.timeMs - b.timeMs
          ),
        };
      } else {
        // Update existing keyframe
        newUnits[unitIndex] = {
          ...unit,
          keyframes: [
            ...unit.keyframes.slice(0, kfIndex),
            { ...unit.keyframes[kfIndex], ...updates },
            ...unit.keyframes.slice(kfIndex + 1),
          ],
        };
      }
      return { ...prev, units: newUnits };
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-9999 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 font-mono"
        >
          X
        </button>

        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-300">
              Cutscene Editor
            </h2>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm font-bold"
            />
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded font-bold shadow"
            >
              Save
            </button>
            <span className="text-sm text-green-400">{saveStatus}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="w-full flex gap-4 p-4 bg-slate-800 border-b border-slate-700 justify-center items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">
                  Background:
                </span>
                <select
                  value={data.backgroundKey}
                  onChange={(e) =>
                    setData({
                      ...data,
                      backgroundKey: e.target.value as BackgroundImageKey,
                    })
                  }
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm max-w-[200px]"
                >
                  {BACKGROUND_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">
                  Duration (ms):
                </span>
                <input
                  type="number"
                  value={data.durationMs}
                  onChange={(e) =>
                    setData({
                      ...data,
                      durationMs: parseInt(e.target.value) || 5000,
                    })
                  }
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm w-24"
                />
              </div>
            </div>

            {/* Preview Area (Fixed Aspect Ratio with Max Height) */}
            <div className="p-4 shrink-0 flex items-center justify-center bg-black w-full border-b border-slate-700 max-h-[50vh] overflow-hidden">
              <CutscenePixiPreview
                data={data}
                currentTimeMs={currentTimeMs}
                creaturesRecord={CREATURES_RECORD}
                onUpdateKeyframe={updateKeyframe}
              />
            </div>

            {/* Timeline Area (Takes up remaining vertical space) */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <CutsceneTimeline
                data={data}
                setData={setData}
                currentTimeMs={currentTimeMs}
                setCurrentTimeMs={setCurrentTimeMs}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                creaturesRecord={CREATURES_RECORD}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 bg-slate-900 border-l border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-sm">
              Add Unit
            </h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 border border-slate-700 p-1 rounded bg-slate-800">
              {Object.values(CREATURES_RECORD).map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => addUnit(c.id)}
                  className="text-left px-2 py-1 text-sm bg-slate-700 hover:bg-cyan-700 rounded truncate transition-colors"
                >
                  {c.name || c.id}
                </button>
              ))}
            </div>

            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-sm mt-4 border-t border-slate-700 pt-4">
              Edit Keyframes
            </h3>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Pause precisely on a keyframe to edit.
            </p>

            <div className="flex flex-col gap-3">
              {data.units.map((u) => {
                const kfIndex = u.keyframes.findIndex(
                  (k) => k.timeMs === currentTimeMs
                );
                if (kfIndex === -1) return null;
                const kf = u.keyframes[kfIndex];
                const creatureName =
                  CREATURES_RECORD[u.speciesId]?.name || u.speciesId;

                const updateKf = (updates: Partial<CutsceneKeyframe>) => {
                  const newUnits = [...data.units];
                  const unitToEdit = newUnits.find((nu) => nu.id === u.id);
                  if (unitToEdit) {
                    unitToEdit.keyframes[kfIndex] = { ...kf, ...updates };
                    setData({ ...data, units: newUnits });
                  }
                };

                return (
                  <div
                    key={u.id}
                    className="bg-slate-800 border border-slate-600 rounded p-2 text-sm flex flex-col gap-2 shadow-lg"
                  >
                    <div className="font-bold text-cyan-400 mb-1">
                      {creatureName} @ {currentTimeMs}ms
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">
                          X Pos (px)
                        </label>
                        <input
                          type="number"
                          value={Math.round(kf.x ?? 400)}
                          onChange={(e) =>
                            updateKf({ x: parseInt(e.target.value) || 0 })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">
                          Y Pos (px)
                        </label>
                        <input
                          type="number"
                          value={Math.round(kf.y ?? 225)}
                          onChange={(e) =>
                            updateKf({ y: parseInt(e.target.value) || 0 })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">
                          Scale
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={kf.scale ?? 1}
                          onChange={(e) =>
                            updateKf({ scale: parseFloat(e.target.value) || 1 })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">
                          Opacity
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          max="1"
                          min="0"
                          value={kf.opacity ?? 1}
                          onChange={(e) =>
                            updateKf({
                              opacity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-2 col-span-2 mt-2 bg-slate-900 p-1 rounded border border-slate-700">
                        <input
                          type="checkbox"
                          checked={kf.facingRight ?? true}
                          onChange={(e) =>
                            updateKf({ facingRight: e.target.checked })
                          }
                          className="rounded cursor-pointer"
                        />
                        <label className="text-xs font-bold text-slate-300">
                          Facing Right
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
