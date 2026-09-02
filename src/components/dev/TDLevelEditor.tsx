'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PixiTDLevelEditor, { PointType } from './PixiTDLevelEditor';
import { TD_LEVELS } from '@/constants/tdLevels';
import {
  CaptureUnitReturnHomeConfig,
  TDLevelData,
  TDWaveEnemyDefinition,
  TDWaveGroup,
} from '@/engine/tower-defense/types';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TDLevelContext } from '@/types/baseGame';
import {
  cloneTDLevelDraft,
  createEmptyTDLevelDraft,
  prepareTDLevelDraftForSave,
  validateTDLevelDraft,
} from '@/utils/tdLevelDraft';
import { resolveTDInitialView } from '@/utils/tdInitialView';

type EditorSidebarTab = 'LEVEL' | 'MAP' | 'WAVES';

const CAPTURE_RETURN_FIELDS: Array<{
  label: string;
  field: keyof CaptureUnitReturnHomeConfig;
  step: number;
}> = [
  { label: 'Path', field: 'pathIndex', step: 1 },
  { label: 'Speed', field: 'speed', step: 0.1 },
  { label: 'Delay ms', field: 'delayMs', step: 100 },
];

export default function TDLevelEditor({ onClose }: { onClose: () => void }) {
  const [selectedLevelKey, setSelectedLevelKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<TDLevelData>(createEmptyTDLevelDraft);
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<EditorSidebarTab>('MAP');

  const paths = draft.paths;
  const placementSpots = draft.placementSpots;
  const environmentUnits = draft.environmentUnits ?? [];
  const captureUnits = draft.captureUnits ?? [];
  const waveEnemyDefinitions = draft.waveEnemyDefinitions;
  const waves = draft.waves;
  const surviveUntil = draft.surviveUntil ?? 0;
  const lives = draft.lives ?? 3;
  const backgroundUrl = draft.backgroundUrl ?? '';
  const backgroundScale = draft.backgroundScale ?? 1;
  const initialView = resolveTDInitialView(
    draft.backgroundScale,
    draft.initialView
  );
  const captureUnitPoints = captureUnits.map((unit) => ({
    ...unit.position,
    tdConfigId: unit.tdConfigId,
  }));

  const availableLevels = useMemo(() => {
    return Object.entries(TD_LEVELS).map(
      ([key, config]) => [key, config.levelData] as [string, TDLevelData]
    );
  }, []);

  useEffect(() => {
    if (availableLevels.length > 0 && !selectedLevelKey) {
      handleSelectLevel(availableLevels[0][0]);
    }
  }, [availableLevels, selectedLevelKey]);

  const handleSelectLevel = (key: string) => {
    const levelData = TD_LEVELS[key as TDLevelContext]?.levelData;
    if (levelData) {
      setDraft(cloneTDLevelDraft(levelData));
      setActivePathIndex(0);
    } else {
      setDraft(createEmptyTDLevelDraft());
      setActivePathIndex(0);
    }
    setSelectedLevelKey(key);
  };

  const handleCreateNew = () => {
    setDraft(createEmptyTDLevelDraft());
    setActivePathIndex(0);
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
      setDraft((previousDraft) => {
        const nextPaths = [...previousDraft.paths];
        const currentPath = [...(nextPaths[activePathIndex] || [])];
        currentPath[index] = { ...currentPath[index], x, y };
        nextPaths[activePathIndex] = currentPath;
        return { ...previousDraft, paths: nextPaths };
      });
    } else if (type === 'PLACEMENT') {
      setDraft((previousDraft) => {
        const nextSpots = [...previousDraft.placementSpots];
        nextSpots[index] = { ...nextSpots[index], x, y };
        return { ...previousDraft, placementSpots: nextSpots };
      });
    } else if (type === 'CAPTURE') {
      setDraft((previousDraft) => {
        const nextUnits = [...(previousDraft.captureUnits ?? [])];
        const currentUnit = nextUnits[index];
        nextUnits[index] = {
          ...currentUnit,
          position: { ...currentUnit.position, x, y },
        };
        return { ...previousDraft, captureUnits: nextUnits };
      });
    } else if (type === 'ENVIRONMENT') {
      setDraft((previousDraft) => {
        const nextUnits = [...(previousDraft.environmentUnits ?? [])];
        const currentUnit = nextUnits[index];
        nextUnits[index] = {
          ...currentUnit,
          position: { ...currentUnit.position, x, y },
        };
        return { ...previousDraft, environmentUnits: nextUnits };
      });
    }
  };

  const handlePointDelete = (type: PointType, index: number) => {
    if (type === 'PATH') {
      setDraft((previousDraft) => {
        const nextPaths = [...previousDraft.paths];
        if (nextPaths[activePathIndex]) {
          nextPaths[activePathIndex] = nextPaths[activePathIndex].filter(
            (_, i) => i !== index
          );
        }
        return { ...previousDraft, paths: nextPaths };
      });
    } else if (type === 'PLACEMENT') {
      setDraft((previousDraft) => ({
        ...previousDraft,
        placementSpots: previousDraft.placementSpots.filter(
          (_, i) => i !== index
        ),
      }));
    } else if (type === 'CAPTURE') {
      setDraft((previousDraft) => ({
        ...previousDraft,
        captureUnits: (previousDraft.captureUnits ?? []).filter(
          (_, i) => i !== index
        ),
      }));
    } else if (type === 'ENVIRONMENT') {
      setDraft((previousDraft) => ({
        ...previousDraft,
        environmentUnits: (previousDraft.environmentUnits ?? []).filter(
          (_, i) => i !== index
        ),
      }));
    }
  };

  const addPathPoint = () => {
    setDraft((previousDraft) => {
      const nextPaths = [...previousDraft.paths];
      if (!nextPaths[activePathIndex]) nextPaths[activePathIndex] = [];
      nextPaths[activePathIndex] = [
        ...nextPaths[activePathIndex],
        { x: 50, y: 50 },
      ];
      return { ...previousDraft, paths: nextPaths };
    });
  };

  const addPlacementSpot = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      placementSpots: [...previousDraft.placementSpots, { x: 50, y: 50 }],
    }));
  };

  const addCaptureUnit = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      captureUnits: [
        ...(previousDraft.captureUnits ?? []),
        { position: { x: 50, y: 50 }, tdConfigId: 'chest_wooden' },
      ],
    }));
  };

  const saveLevel = async () => {
    let nameToSave = selectedLevelKey;
    if (selectedLevelKey === 'NEW_LEVEL') {
      if (!newLevelName) {
        setShowNewModal(true);
        return;
      }
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(newLevelName)) {
        alert(
          'Level names must be valid TypeScript identifiers (letters, numbers, _ or $, and cannot start with a number).'
        );
        return;
      }
      nameToSave = newLevelName;
    }

    if (!nameToSave) return;

    const validationErrors = validateTDLevelDraft(
      draft,
      new Set(Object.keys(TD_CREATURE_DEFS)),
      new Set(Object.keys(ENEMY_ABILITY_DEFS))
    );
    if (validationErrors.length > 0) {
      alert(`Cannot save this level:\n\n${validationErrors.join('\n')}`);
      return;
    }

    setIsSaving(true);
    try {
      const data = prepareTDLevelDraftForSave(draft);

      const res = await fetch('/api/dev/td-levels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelContext:
            selectedLevelKey === 'NEW_LEVEL' ? undefined : selectedLevelKey,
          levelName: nameToSave,
          fileName: nameToSave,
          config: data,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save level');
      }

      alert('Saved successfully!');
      setShowNewModal(false);
    } catch (err) {
      console.error(err);
      alert('Error saving level');
    } finally {
      setIsSaving(false);
    }
  };

  const addWave = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      waves: [
        ...previousDraft.waves,
        {
          id: `wave_${Date.now()}`,
          groups: [],
        },
      ],
    }));
  };

  const addGroupToWave = (waveIndex: number) => {
    setDraft((previousDraft) => {
      const nextWaves = cloneTDLevelDraft(previousDraft).waves;
      nextWaves[waveIndex].groups.push({
        enemyDefinitionId: previousDraft.waveEnemyDefinitions[0]?.id ?? '',
        count: 5,
        spawnIntervalMs: 1000,
        delayBeforeGroupMs: 0,
        pathIndex: 0,
        turnAroundAtEnd: false,
        concurrentWithPrevious: false,
      });
      return { ...previousDraft, waves: nextWaves };
    });
  };

  const addWaveEnemyDefinition = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      waveEnemyDefinitions: [
        ...previousDraft.waveEnemyDefinitions,
        {
          id: `enemy_${Date.now()}`,
          creatureId: Object.keys(TD_CREATURE_DEFS)[0] ?? '',
          level: 1,
          speedMultiplier: 1,
          hpMultiplier: 1,
          defenseMultiplier: 1,
          specialDefenseMultiplier: 1,
        },
      ],
    }));
  };

  const updateWaveEnemyDefinition = <K extends keyof TDWaveEnemyDefinition>(
    definitionIndex: number,
    field: K,
    value: TDWaveEnemyDefinition[K]
  ) => {
    setDraft((previousDraft) => {
      const nextDefinitions = structuredClone(
        previousDraft.waveEnemyDefinitions
      );
      const previousId = nextDefinitions[definitionIndex].id;
      nextDefinitions[definitionIndex][field] = value;
      if (field !== 'id' || typeof value !== 'string') {
        return { ...previousDraft, waveEnemyDefinitions: nextDefinitions };
      }

      const nextWaves = structuredClone(previousDraft.waves);
      nextWaves.forEach((wave) => {
        wave.groups.forEach((group) => {
          if (group.enemyDefinitionId === previousId) {
            group.enemyDefinitionId = value;
          }
        });
      });
      return {
        ...previousDraft,
        waveEnemyDefinitions: nextDefinitions,
        waves: nextWaves,
      };
    });
  };

  const deleteWaveEnemyDefinition = (definitionIndex: number) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      waveEnemyDefinitions: previousDraft.waveEnemyDefinitions.filter(
        (_, index) => index !== definitionIndex
      ),
    }));
  };

  const updateGroup = <K extends keyof TDWaveGroup>(
    waveIndex: number,
    groupIndex: number,
    field: K,
    value: TDWaveGroup[K]
  ) => {
    setDraft((previousDraft) => {
      const nextWaves = cloneTDLevelDraft(previousDraft).waves;
      nextWaves[waveIndex].groups[groupIndex][field] = value;
      return { ...previousDraft, waves: nextWaves };
    });
  };

  const deleteWave = (waveIndex: number) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      waves: previousDraft.waves.filter((_, i) => i !== waveIndex),
    }));
  };

  const deleteGroup = (waveIndex: number, groupIndex: number) => {
    setDraft((previousDraft) => {
      const nextWaves = cloneTDLevelDraft(previousDraft).waves;
      nextWaves[waveIndex].groups.splice(groupIndex, 1);
      return { ...previousDraft, waves: nextWaves };
    });
  };

  return (
    <div className="fixed inset-0 z-9998 flex flex-col bg-slate-900">
      {/* New Level Modal */}
      {showNewModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="rounded-lg bg-slate-800 p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-white">
              Enter New Level Name
            </h3>
            <input
              type="text"
              className="mb-4 w-full rounded bg-slate-700 p-2 text-white"
              value={newLevelName}
              onChange={(e) => setNewLevelName(e.target.value)}
              placeholder="e.g., MyNewLevel"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={saveLevel}
                disabled={!newLevelName || isSaving}
                className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600 disabled:bg-slate-600"
              >
                {isSaving ? 'Saving...' : 'Create & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-cyan-800 bg-slate-800 p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-cyan-400">TD Level Editor</h2>
          <select
            value={selectedLevelKey || ''}
            onChange={(e) => handleSelectLevel(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
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
              <option value="NEW_LEVEL">
                {newLevelName ? `(New: ${newLevelName})` : '(New Level)'}
              </option>
            )}
          </select>
          <button
            onClick={handleCreateNew}
            className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600"
          >
            + New
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={saveLevel}
            disabled={isSaving || !selectedLevelKey}
            className={`rounded px-4 py-2 text-sm font-bold text-white ${isSaving ? 'bg-slate-600' : 'bg-green-700 hover:bg-green-600'}`}
          >
            {isSaving ? 'Saving...' : 'Save Level'}
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-600 px-4 py-2 font-bold text-white hover:bg-slate-500"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PixiTDLevelEditor
          paths={paths}
          activePathIndex={activePathIndex}
          placementSpots={placementSpots}
          captureUnits={captureUnitPoints}
          environmentUnits={environmentUnits}
          deleteMode={deleteMode}
          onPointMove={handlePointMove}
          onPointDelete={handlePointDelete}
          backgroundUrl={backgroundUrl}
          backgroundScale={backgroundScale}
          initialView={draft.initialView}
        />

        {/* Editor Sidebar */}
        <aside className="flex w-96 shrink-0 flex-col border-l border-cyan-800 bg-slate-800">
          <div className="grid grid-cols-3 border-b border-slate-700 bg-slate-900 p-2">
            {(['LEVEL', 'MAP', 'WAVES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSidebarTab(tab)}
                className={
                  activeSidebarTab === tab
                    ? 'rounded bg-cyan-700 px-3 py-2 text-sm font-bold text-white'
                    : 'rounded px-3 py-2 text-sm font-bold text-slate-400 hover:bg-slate-700 hover:text-white'
                }
              >
                {tab === 'LEVEL' ? 'Level' : tab === 'MAP' ? 'Map' : 'Waves'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeSidebarTab === 'LEVEL' && (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                    Gameplay
                  </h3>
                  <div className="space-y-3 rounded border border-slate-700 bg-slate-900 p-3">
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">
                        Survive (seconds)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={surviveUntil}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            surviveUntil: value > 0 ? value : undefined,
                          }));
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                        placeholder="0 = clear waves"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">Lives</span>
                      <input
                        type="number"
                        min="-1"
                        value={lives}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            lives:
                              isNaN(value) || value === 3 ? undefined : value,
                          }));
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                        placeholder="3"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                    Background
                  </h3>
                  <div className="space-y-3 rounded border border-slate-700 bg-slate-900 p-3">
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">Image URL</span>
                      <input
                        type="text"
                        value={backgroundUrl}
                        onChange={(e) =>
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            backgroundUrl: e.target.value || undefined,
                          }))
                        }
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                        placeholder="/battles/bg/..."
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">
                        Background scale
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={backgroundScale}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 1;
                          setDraft((previousDraft) => {
                            const nextScale = value > 1 ? value : undefined;
                            const currentView = resolveTDInitialView(
                              previousDraft.backgroundScale,
                              previousDraft.initialView
                            );
                            return {
                              ...previousDraft,
                              backgroundScale: nextScale,
                              initialView: previousDraft.initialView
                                ? resolveTDInitialView(nextScale, currentView)
                                : undefined,
                            };
                          });
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-3">
                    <h3 className="text-sm font-bold tracking-wide text-cyan-400 uppercase">
                      Starting View
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Offsets use the available pannable area. Zoom matches the
                      in-level +/− controls.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded border border-slate-700 bg-slate-900 p-3">
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">X offset %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={initialView.offsetX}
                        onChange={(e) => {
                          const offsetX = Number(e.target.value);
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            initialView: {
                              ...resolveTDInitialView(
                                previousDraft.backgroundScale,
                                previousDraft.initialView
                              ),
                              offsetX,
                            },
                          }));
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">Y offset %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={initialView.offsetY}
                        onChange={(e) => {
                          const offsetY = Number(e.target.value);
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            initialView: {
                              ...resolveTDInitialView(
                                previousDraft.backgroundScale,
                                previousDraft.initialView
                              ),
                              offsetY,
                            },
                          }));
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                      />
                    </label>
                    <label className="col-span-2 block text-sm text-slate-300">
                      <span className="mb-1 block font-bold">Zoom</span>
                      <input
                        type="number"
                        min={1 / backgroundScale}
                        max="1"
                        step="0.1"
                        value={initialView.zoom}
                        onChange={(e) => {
                          const zoom = Number(e.target.value);
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            initialView: {
                              ...resolveTDInitialView(
                                previousDraft.backgroundScale,
                                previousDraft.initialView
                              ),
                              zoom,
                            },
                          }));
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                      />
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeSidebarTab === 'MAP' && (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                    Enemy Paths
                  </h3>
                  <div className="space-y-3 rounded border border-slate-700 bg-slate-900 p-3">
                    <p className="text-xs text-slate-500">
                      Drag anywhere on the canvas to pan beyond the map edges.
                      Path points may be placed outside the 0–100 map bounds.
                    </p>
                    <select
                      value={activePathIndex}
                      onChange={(e) =>
                        setActivePathIndex(Number(e.target.value))
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                    >
                      {paths.map((_, index) => (
                        <option key={index} value={index}>
                          Path {index + 1}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            paths: [...previousDraft.paths, []],
                          }))
                        }
                        className="rounded bg-cyan-700 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-600"
                      >
                        New Path
                      </button>
                      <button
                        onClick={() => {
                          if (paths.length > 1) {
                            setDraft((previousDraft) => ({
                              ...previousDraft,
                              paths: previousDraft.paths.filter(
                                (_, index) => index !== activePathIndex
                              ),
                            }));
                            setActivePathIndex((previous) =>
                              Math.max(0, previous - 1)
                            );
                          }
                        }}
                        disabled={paths.length <= 1}
                        className="rounded bg-red-800 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:bg-slate-700"
                      >
                        Delete Path
                      </button>
                    </div>
                    <button
                      onClick={addPathPoint}
                      className="w-full rounded bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
                    >
                      Add Path Point
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                    Map Objects
                  </h3>
                  <div className="space-y-2 rounded border border-slate-700 bg-slate-900 p-3">
                    <button
                      onClick={addPlacementSpot}
                      className="w-full rounded bg-orange-700 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
                    >
                      Add Placement Spot
                    </button>
                    <button
                      onClick={addCaptureUnit}
                      className="w-full rounded bg-purple-700 px-3 py-2 text-sm font-bold text-white hover:bg-purple-600"
                    >
                      Add Capture Unit
                    </button>
                    <button
                      onClick={() => setDeleteMode((previous) => !previous)}
                      className={
                        deleteMode
                          ? 'w-full rounded border-2 border-red-500 bg-red-900 px-3 py-2 text-sm font-bold text-white'
                          : 'w-full rounded border-2 border-transparent bg-slate-700 px-3 py-2 text-sm font-bold text-white hover:bg-slate-600'
                      }
                    >
                      Delete Mode: {deleteMode ? 'On' : 'Off'}
                    </button>
                  </div>
                </section>

                {captureUnits.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-bold tracking-wide text-purple-400 uppercase">
                      Capture Units
                    </h3>
                    <div className="space-y-2 rounded border border-purple-800 bg-slate-900 p-3">
                      {captureUnits.map((unit, index) => (
                        <div
                          key={index}
                          className="space-y-2 border-b border-slate-800 pb-3 text-xs text-slate-300 last:border-b-0 last:pb-0"
                        >
                          <label className="block">
                            <span className="mb-1 block">Unit {index + 1}</span>
                            <input
                              type="text"
                              className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                              value={unit.tdConfigId}
                              onChange={(e) => {
                                setDraft((previousDraft) => {
                                  const nextUnits = [
                                    ...(previousDraft.captureUnits ?? []),
                                  ];
                                  nextUnits[index] = {
                                    ...nextUnits[index],
                                    tdConfigId: e.target.value,
                                  };
                                  return {
                                    ...previousDraft,
                                    captureUnits: nextUnits,
                                  };
                                });
                              }}
                              placeholder="tdConfigId"
                            />
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(unit.returnHome)}
                              onChange={(event) => {
                                setDraft((previousDraft) => {
                                  const nextUnits = [
                                    ...(previousDraft.captureUnits ?? []),
                                  ];
                                  nextUnits[index] = {
                                    ...nextUnits[index],
                                    returnHome: event.target.checked
                                      ? { pathIndex: 0, speed: 2, delayMs: 500 }
                                      : undefined,
                                  };
                                  return {
                                    ...previousDraft,
                                    captureUnits: nextUnits,
                                  };
                                });
                              }}
                            />
                            Return home when dropped
                          </label>
                          {unit.returnHome && (
                            <div className="grid grid-cols-3 gap-2">
                              {CAPTURE_RETURN_FIELDS.map(
                                ({ label, field, step }) => (
                                  <label key={field} className="block">
                                    <span className="mb-1 block">{label}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step={step}
                                      className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                                      value={unit.returnHome?.[field] ?? 0}
                                      onChange={(event) => {
                                        setDraft((previousDraft) => {
                                          const nextUnits = [
                                            ...(previousDraft.captureUnits ??
                                              []),
                                          ];
                                          const currentUnit = nextUnits[index];
                                          if (!currentUnit.returnHome) {
                                            return previousDraft;
                                          }
                                          nextUnits[index] = {
                                            ...currentUnit,
                                            returnHome: {
                                              ...currentUnit.returnHome,
                                              [field]: Number(
                                                event.target.value
                                              ),
                                            },
                                          };
                                          return {
                                            ...previousDraft,
                                            captureUnits: nextUnits,
                                          };
                                        });
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {environmentUnits.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-bold tracking-wide text-yellow-400 uppercase">
                      Environment Units
                    </h3>
                    <div className="space-y-2 rounded border border-yellow-800 bg-slate-900 p-3">
                      {environmentUnits.map((unit, index) => (
                        <div key={index} className="text-xs text-slate-400">
                          E{index}: {unit.tdConfigId} @ [
                          {unit.position.x.toFixed(1)},{' '}
                          {unit.position.y.toFixed(1)}]
                        </div>
                      ))}
                      <p className="text-xs text-yellow-200/70">
                        Drag the yellow E markers to move these units. Their
                        gameplay sprites and facing directions are previewed on
                        the map.
                      </p>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeSidebarTab === 'WAVES' && (
              <div>
                <div className="mb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-emerald-400">
                        Enemy Definitions ({waveEnemyDefinitions.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Reusable level-specific variants referenced by wave
                        groups.
                      </p>
                    </div>
                    <button
                      onClick={addWaveEnemyDefinition}
                      className="rounded bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600"
                    >
                      + Enemy Definition
                    </button>
                  </div>

                  <div className="space-y-3">
                    {waveEnemyDefinitions.map((definition, definitionIndex) => (
                      <div
                        key={`${definition.id}_${definitionIndex}`}
                        className="relative rounded border border-emerald-800 bg-slate-900 p-3 text-xs"
                      >
                        <button
                          onClick={() =>
                            deleteWaveEnemyDefinition(definitionIndex)
                          }
                          className="absolute top-2 right-2 font-bold text-red-500 hover:text-red-400"
                        >
                          X
                        </button>

                        <div className="grid grid-cols-2 gap-2 pr-5">
                          <label className="block text-slate-400">
                            Unique ID
                            <input
                              type="text"
                              value={definition.id}
                              onChange={(event) =>
                                updateWaveEnemyDefinition(
                                  definitionIndex,
                                  'id',
                                  event.target.value
                                )
                              }
                              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                            />
                          </label>
                          <label className="block text-slate-400">
                            Creature
                            <select
                              value={definition.creatureId ?? ''}
                              onChange={(event) =>
                                updateWaveEnemyDefinition(
                                  definitionIndex,
                                  'creatureId',
                                  event.target.value
                                )
                              }
                              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                            >
                              {Object.keys(TD_CREATURE_DEFS).map((creatureId) => (
                                <option key={creatureId} value={creatureId}>
                                  {creatureId}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-slate-400">
                            Level
                            <input
                              type="number"
                              min="1"
                              value={definition.level}
                              onChange={(event) =>
                                updateWaveEnemyDefinition(
                                  definitionIndex,
                                  'level',
                                  parseInt(event.target.value) || 1
                                )
                              }
                              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                            />
                          </label>
                          {(
                            [
                              ['speedMultiplier', 'Speed Multiplier'],
                              ['hpMultiplier', 'HP Multiplier'],
                              ['defenseMultiplier', 'Defense Multiplier'],
                              [
                                'specialDefenseMultiplier',
                                'Special Defense Multiplier',
                              ],
                            ] as const
                          ).map(([field, label]) => (
                            <label key={field} className="block text-slate-400">
                              {label}
                              <input
                                type="number"
                                min="0.01"
                                step="0.1"
                                value={definition[field] ?? 1}
                                onChange={(event) =>
                                  updateWaveEnemyDefinition(
                                    definitionIndex,
                                    field,
                                    parseFloat(event.target.value) || 1
                                  )
                                }
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                              />
                            </label>
                          ))}
                          <label className="block text-slate-400">
                            Weakened Threshold
                            <input
                              type="number"
                              min="0.01"
                              max="1"
                              step="0.05"
                              placeholder="0.9"
                              value={definition.weakenedThreshold ?? ''}
                              onChange={(event) =>
                                updateWaveEnemyDefinition(
                                  definitionIndex,
                                  'weakenedThreshold',
                                  event.target.value === ''
                                    ? undefined
                                    : parseFloat(event.target.value) || undefined
                                )
                              }
                              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                            />
                          </label>
                          <label className="block text-slate-400">
                            Enemy Ability
                            <select
                              value={definition.abilityId ?? ''}
                              onChange={(event) =>
                                updateWaveEnemyDefinition(
                                  definitionIndex,
                                  'abilityId',
                                  event.target.value || undefined
                                )
                              }
                              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                            >
                              <option value="">None</option>
                              {Object.keys(ENEMY_ABILITY_DEFS).map(
                                (abilityId) => (
                                  <option key={abilityId} value={abilityId}>
                                    {abilityId}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                    {waveEnemyDefinitions.length === 0 && (
                      <p className="rounded border border-dashed border-slate-700 p-3 text-center text-xs text-slate-500 italic">
                        Add an enemy definition before adding wave groups.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-cyan-400">
                    Waves ({waves.length})
                  </h3>
                  <button
                    onClick={addWave}
                    className="rounded bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600"
                  >
                    Add Wave
                  </button>
                </div>
                <div className="space-y-4">
                  {waves.map((wave, wIdx) => (
                    <div
                      key={wave.id}
                      className="rounded border border-slate-700 bg-slate-900 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">
                          Wave {wIdx + 1}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addGroupToWave(wIdx)}
                            disabled={waveEnemyDefinitions.length === 0}
                            className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                          >
                            + Group
                          </button>
                          <button
                            onClick={() => deleteWave(wIdx)}
                            className="rounded bg-red-900 px-2 py-1 text-xs text-white hover:bg-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {wave.groups.map((group, gIdx) => (
                          <div
                            key={gIdx}
                            className="relative rounded border border-slate-600 bg-slate-800 p-2 text-xs"
                          >
                            <button
                              onClick={() => deleteGroup(wIdx, gIdx)}
                              className="absolute top-1 right-1 font-bold text-red-500 hover:text-red-400"
                            >
                              X
                            </button>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-1 block text-slate-400">
                                  Enemy Definition
                                </label>
                                <select
                                  value={group.enemyDefinitionId}
                                  onChange={(e) =>
                                    updateGroup(
                                      wIdx,
                                      gIdx,
                                      'enemyDefinitionId',
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                                >
                                  {waveEnemyDefinitions.map(
                                    (definition) => (
                                      <option
                                        key={definition.id}
                                        value={definition.id}
                                      >
                                        {definition.id} ({
                                          definition.creatureId ?? 'structure'
                                        })
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-slate-400">
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
                                  className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-slate-400">
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
                                  className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-slate-400">
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
                                  className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-slate-400">
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
                                  className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-white"
                                >
                                  {paths.map((_, i) => (
                                    <option key={i} value={i}>
                                      Path {i}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2 mt-2 flex flex-col gap-2">
                                <div className="flex items-center">
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
                                    className="mr-2 h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-950"
                                  />
                                  <label className="text-slate-300">
                                    Turn Around at End
                                  </label>
                                </div>

                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={!!group.concurrentWithPrevious}
                                    onChange={(e) =>
                                      updateGroup(
                                        wIdx,
                                        gIdx,
                                        'concurrentWithPrevious',
                                        e.target.checked
                                      )
                                    }
                                    className="mr-2 h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-950"
                                  />
                                  <label className="text-slate-300">
                                    Concurrent with Previous Group
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {wave.groups.length === 0 && (
                          <p className="py-2 text-center text-xs text-slate-500 italic">
                            No enemy groups in this wave yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {waves.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500 italic">
                      No waves defined. Enemies will not spawn using the new
                      wave system.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
