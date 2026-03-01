'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PixiTDLevelEditor, { PointType } from './PixiTDLevelEditor';
import * as tdLevels from '@/constants/tdLevels';
import { TDLevelData, TDWave, TDWaveGroup } from '@/engine/tower-defense/types';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';

export default function TDLevelEditor({ onClose }: { onClose: () => void }) {
  const [selectedLevelKey, setSelectedLevelKey] = useState<string | null>(null);

  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([[]]);
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [placementSpots, setPlacementSpots] = useState<
    { x: number; y: number }[]
  >([]);
  const [environmentUnits, setEnvironmentUnits] = useState<
    {
      position: { x: number; y: number };
      tdConfigId: string;
      facingDirection?: 'up' | 'down' | 'left' | 'right';
    }[]
  >([]);
  const [captureUnits, setCaptureUnits] = useState<
    { x: number; y: number; tdConfigId: string }[]
  >([]);
  const [waves, setWaves] = useState<TDWave[]>([]);
  const [surviveUntil, setSurviveUntil] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

  const availableLevels = useMemo(() => {
    return Object.entries(tdLevels).filter(([key, value]) => {
      const val = value as any;
      return (
        val && Array.isArray(val.paths) && Array.isArray(val.placementSpots)
      );
    }) as [string, TDLevelData][];
  }, []);

  useEffect(() => {
    if (availableLevels.length > 0 && !selectedLevelKey) {
      handleSelectLevel(availableLevels[0][0]);
    }
  }, [availableLevels, selectedLevelKey]);

  const handleSelectLevel = (key: string) => {
    const levelData = (tdLevels as any)[key] as TDLevelData;
    if (levelData) {
      // Deep copy
      if (levelData.paths) {
        setPaths(JSON.parse(JSON.stringify(levelData.paths)));
      } else {
        setPaths([[]]);
      }
      setActivePathIndex(0);
      setPlacementSpots(JSON.parse(JSON.stringify(levelData.placementSpots)));
      setEnvironmentUnits(
        levelData.environmentUnits
          ? JSON.parse(JSON.stringify(levelData.environmentUnits))
          : []
      );
      setCaptureUnits(
        levelData.captureUnits
          ? levelData.captureUnits.map((cu) => ({
              x: cu.position.x,
              y: cu.position.y,
              tdConfigId: cu.tdConfigId,
            }))
          : []
      );
      setWaves(
        levelData.waves ? JSON.parse(JSON.stringify(levelData.waves)) : []
      );
      setSurviveUntil(levelData.surviveUntil || 0);
      setLives(levelData.lives !== undefined ? levelData.lives : 3);
    } else {
      setPaths([[]]);
      setActivePathIndex(0);
      setPlacementSpots([]);
      setEnvironmentUnits([]);
      setCaptureUnits([]);
      setWaves([]);
      setSurviveUntil(0);
      setLives(3);
    }
    setSelectedLevelKey(key);
  };

  const handleCreateNew = () => {
    setPaths([[]]);
    setActivePathIndex(0);
    setPlacementSpots([]);
    setEnvironmentUnits([]);
    setCaptureUnits([]);
    setWaves([]);
    setSurviveUntil(0);
    setLives(3);
    setSelectedLevelKey('NEW_LEVEL');
    setNewLevelName('');
    setShowNewModal(true);
  };

  const handlePointMove = (
    type: PointType,
    index: number,
    x: number,
    y: number
  ) => {
    if (type === 'PATH') {
      setPaths((prev) => {
        const next = [...prev];
        const currentPath = [...(next[activePathIndex] || [])];
        currentPath[index] = { ...currentPath[index], x, y };
        next[activePathIndex] = currentPath;
        return next;
      });
    } else if (type === 'PLACEMENT') {
      setPlacementSpots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], x, y };
        return next;
      });
    } else if (type === 'CAPTURE') {
      setCaptureUnits((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], x, y };
        return next;
      });
    }
  };

  const handlePointDelete = (type: PointType, index: number) => {
    if (type === 'PATH') {
      setPaths((prev) => {
        const next = [...prev];
        if (next[activePathIndex]) {
          next[activePathIndex] = next[activePathIndex].filter(
            (_, i) => i !== index
          );
        }
        return next;
      });
    } else if (type === 'PLACEMENT') {
      setPlacementSpots((prev) => prev.filter((_, i) => i !== index));
    } else if (type === 'CAPTURE') {
      setCaptureUnits((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addPathPoint = () => {
    setPaths((prev) => {
      const next = [...prev];
      if (!next[activePathIndex]) next[activePathIndex] = [];
      next[activePathIndex] = [...next[activePathIndex], { x: 50, y: 50 }];
      return next;
    });
  };

  const addPlacementSpot = () => {
    setPlacementSpots((prev) => [...prev, { x: 50, y: 50 }]);
  };

  const addCaptureUnit = () => {
    setCaptureUnits((prev) => [
      ...prev,
      { x: 50, y: 50, tdConfigId: 'chest_wooden' },
    ]);
  };

  const saveLevel = async () => {
    let nameToSave = selectedLevelKey;
    if (selectedLevelKey === 'NEW_LEVEL') {
      if (!newLevelName) {
        setShowNewModal(true);
        return;
      }
      nameToSave = newLevelName;
    }

    if (!nameToSave) return;

    setIsSaving(true);
    try {
      const data: TDLevelData = {
        paths: paths.map((path) =>
          path.map((p) => ({
            x: Number(p.x.toFixed(2)),
            y: Number(p.y.toFixed(2)),
          }))
        ),
        placementSpots: placementSpots.map((s) => ({
          x: Number(s.x.toFixed(2)),
          y: Number(s.y.toFixed(2)),
        })),
        environmentUnits:
          environmentUnits.length > 0 ? environmentUnits : undefined,
        captureUnits: captureUnits.map((c) => ({
          position: {
            x: Number(c.x.toFixed(2)),
            y: Number(c.y.toFixed(2)),
          },
          tdConfigId: c.tdConfigId,
        })),
        waves: waves,
        surviveUntil: surviveUntil > 0 ? surviveUntil : undefined,
        lives: lives !== 3 ? lives : undefined,
      };

      const res = await fetch('/api/dev/td-levels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelName: nameToSave,
          fileName: nameToSave,
          config: data,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save level');
      }

      alert('Saved successfully!');
      if (selectedLevelKey === 'NEW_LEVEL') {
        setSelectedLevelKey(nameToSave);
      }
      setShowNewModal(false);
    } catch (err) {
      console.error(err);
      alert('Error saving level');
    } finally {
      setIsSaving(false);
    }
  };

  const addWave = () => {
    setWaves((prev) => [
      ...prev,
      {
        id: `wave_${Date.now()}`,
        groups: [],
      },
    ]);
  };

  const addGroupToWave = (waveIndex: number) => {
    setWaves((prev) => {
      const next = [...prev];
      next[waveIndex].groups.push({
        definitionId: Object.keys(TD_CREATURE_DEFS)[0] || '',
        count: 5,
        spawnIntervalMs: 1000,
        delayBeforeGroupMs: 0,
        pathIndex: 0,
        turnAroundAtEnd: false,
      });
      return next;
    });
  };

  const updateGroup = (
    waveIndex: number,
    groupIndex: number,
    field: keyof TDWaveGroup,
    value: any
  ) => {
    setWaves((prev) => {
      const next = JSON.parse(JSON.stringify(prev)); // deep copy to ensure re-render
      next[waveIndex].groups[groupIndex][field] = value;
      return next;
    });
  };

  const deleteWave = (waveIndex: number) => {
    setWaves((prev) => prev.filter((_, i) => i !== waveIndex));
  };

  const deleteGroup = (waveIndex: number, groupIndex: number) => {
    setWaves((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[waveIndex].groups.splice(groupIndex, 1);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-9998 bg-slate-900 flex flex-col">
      {/* New Level Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              Enter New Level Name
            </h3>
            <input
              type="text"
              className="w-full p-2 bg-slate-700 text-white rounded mb-4"
              value={newLevelName}
              onChange={(e) => setNewLevelName(e.target.value)}
              placeholder="e.g., MyNewLevel"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveLevel}
                disabled={!newLevelName || isSaving}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white disabled:bg-slate-600"
              >
                {isSaving ? 'Saving...' : 'Create & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-between border-b border-cyan-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-cyan-400">TD Level Editor</h2>
          <select
            value={selectedLevelKey || ''}
            onChange={(e) => handleSelectLevel(e.target.value)}
            className="bg-slate-950 text-white px-2 py-1 rounded text-sm border border-slate-700"
          >
            <option value="" disabled>
              Select a Level...
            </option>
            {availableLevels.map(([key]) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
            {selectedLevelKey === 'NEW_LEVEL' && (
              <option value="NEW_LEVEL">(New Level)</option>
            )}
          </select>
          <button
            onClick={handleCreateNew}
            className="text-xs bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded text-white"
          >
            + New
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={activePathIndex}
            onChange={(e) => setActivePathIndex(Number(e.target.value))}
            className="bg-slate-950 text-white px-2 py-1 rounded text-sm border border-slate-700"
          >
            {paths.map((_, i) => (
              <option key={i} value={i}>
                Path {i}
              </option>
            ))}
          </select>
          <button
            onClick={() => setPaths((prev) => [...prev, []])}
            className="text-xs bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded text-white"
          >
            + New Path
          </button>
          <button
            onClick={() => {
              if (paths.length > 1) {
                setPaths((prev) =>
                  prev.filter((_, i) => i !== activePathIndex)
                );
                setActivePathIndex((prev) => Math.max(0, prev - 1));
              }
            }}
            disabled={paths.length <= 1}
            className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-white disabled:bg-slate-600"
          >
            Del Path
          </button>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <button
            onClick={addPathPoint}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white font-bold text-sm"
          >
            + Path Point
          </button>
          <button
            onClick={addPlacementSpot}
            className="px-4 py-2 bg-orange-700 hover:bg-orange-600 rounded text-white font-bold text-sm"
          >
            + Placement Spot
          </button>
          <button
            onClick={addCaptureUnit}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded text-white font-bold text-sm"
          >
            + Capture Unit
          </button>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm font-bold">
              Survive (s):
            </label>
            <input
              type="number"
              min="0"
              value={surviveUntil}
              onChange={(e) => setSurviveUntil(parseInt(e.target.value) || 0)}
              className="w-20 bg-slate-950 text-white rounded p-1 border border-slate-700 text-sm"
              placeholder="0 = clear waves"
            />
          </div>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm font-bold">Lives:</label>
            <input
              type="number"
              min="-1"
              value={lives}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setLives(isNaN(val) ? 3 : val);
              }}
              className="w-16 bg-slate-950 text-white rounded p-1 border border-slate-700 text-sm"
              placeholder="3"
            />
          </div>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <button
            onClick={() => setDeleteMode((prev) => !prev)}
            className={`px-4 py-2 rounded text-white font-bold text-sm border-2 ${
              deleteMode
                ? 'bg-red-900 border-red-500'
                : 'bg-slate-700 border-transparent hover:bg-slate-600'
            }`}
          >
            Delete Mode: {deleteMode ? 'ON' : 'OFF'}
          </button>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <button
            onClick={saveLevel}
            disabled={isSaving || !selectedLevelKey}
            className={`px-4 py-2 rounded text-white font-bold text-sm ${isSaving ? 'bg-slate-600' : 'bg-green-700 hover:bg-green-600'}`}
          >
            {isSaving ? 'Saving...' : 'Save Level API'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold ml-4"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <PixiTDLevelEditor
          paths={paths}
          activePathIndex={activePathIndex}
          placementSpots={placementSpots}
          captureUnits={captureUnits}
          deleteMode={deleteMode}
          onPointMove={handlePointMove}
          onPointDelete={handlePointDelete}
        />

        {/* Waves Editor Sidebar */}
        <div className="w-80 shrink-0 bg-slate-800 border-l border-cyan-800 overflow-y-auto p-4 origin-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-cyan-400">
              Waves ({waves.length})
            </h3>
            <button
              onClick={addWave}
              className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-white text-xs font-bold"
            >
              + Add Wave
            </button>
          </div>

          <div className="space-y-4">
            {/* Environment Units Configs (Read-only rendering loop to show what's there) */}
            {environmentUnits.length > 0 && (
              <div className="bg-slate-900 p-3 rounded border border-yellow-800">
                <h4 className="font-bold text-sm mb-2 text-yellow-400">
                  Environment Units (Preserved)
                </h4>
                {environmentUnits.map((eu, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col mb-2 text-xs text-slate-400"
                  >
                    <span>
                      {eu.tdConfigId} @ [{eu.position.x}, {eu.position.y}]
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Capture Units Configs */}
            {captureUnits.length > 0 && (
              <div className="bg-slate-900 p-3 rounded border border-purple-800">
                <h4 className="font-bold text-sm mb-2 text-purple-400">
                  Capture Units Config
                </h4>
                {captureUnits.map((cu, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between mb-2 text-xs"
                  >
                    <span className="text-slate-300 w-16">Unit {idx}</span>
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 text-white rounded p-1 border border-slate-700"
                      value={cu.tdConfigId}
                      onChange={(e) => {
                        setCaptureUnits((prev) => {
                          const next = [...prev];
                          next[idx] = {
                            ...next[idx],
                            tdConfigId: e.target.value,
                          };
                          return next;
                        });
                      }}
                      placeholder="tdConfigId"
                    />
                  </div>
                ))}
              </div>
            )}

            {waves.map((wave, wIdx) => (
              <div
                key={wave.id}
                className="bg-slate-900 p-3 rounded border border-slate-700"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-white text-sm">
                    Wave {wIdx + 1}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addGroupToWave(wIdx)}
                      className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white"
                    >
                      + Group
                    </button>
                    <button
                      onClick={() => deleteWave(wIdx)}
                      className="text-xs bg-red-900 hover:bg-red-800 px-2 py-1 rounded text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {wave.groups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="bg-slate-800 p-2 rounded relative border border-slate-600 text-xs"
                    >
                      <button
                        onClick={() => deleteGroup(wIdx, gIdx)}
                        className="absolute top-1 right-1 text-red-500 hover:text-red-400 font-bold"
                      >
                        X
                      </button>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Enemy Type
                          </label>
                          <select
                            value={group.definitionId}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'definitionId',
                                e.target.value
                              )
                            }
                            className="w-full bg-slate-950 text-white rounded p-1 border border-slate-700"
                          >
                            {Object.keys(TD_CREATURE_DEFS).map((defId) => (
                              <option key={defId} value={defId}>
                                {defId}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Count
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={group.count}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'count',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full bg-slate-950 text-white rounded p-1 border border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Interval (ms)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={group.spawnIntervalMs}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'spawnIntervalMs',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full bg-slate-950 text-white rounded p-1 border border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Delay Before (ms)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={group.delayBeforeGroupMs}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'delayBeforeGroupMs',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full bg-slate-950 text-white rounded p-1 border border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Path Index
                          </label>
                          <select
                            value={group.pathIndex}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'pathIndex',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full bg-slate-950 text-white rounded p-1 border border-slate-700"
                          >
                            {paths.map((_, i) => (
                              <option key={i} value={i}>
                                Path {i}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={!!group.turnAroundAtEnd}
                            onChange={(e) =>
                              updateGroup(
                                wIdx,
                                gIdx,
                                'turnAroundAtEnd',
                                e.target.checked
                              )
                            }
                            className="mr-2 h-4 w-4 bg-slate-950 border-slate-700 rounded cursor-pointer"
                          />
                          <label className="text-slate-300">
                            Turn Around at End
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {wave.groups.length === 0 && (
                    <p className="text-slate-500 text-xs italic text-center py-2">
                      No enemy groups in this wave yet.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {waves.length === 0 && (
              <p className="text-slate-500 text-sm italic text-center py-8">
                No waves defined. Enemies will not spawn using the new wave
                system.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
