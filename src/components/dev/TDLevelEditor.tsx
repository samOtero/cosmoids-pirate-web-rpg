'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PixiTDLevelEditor, { PointType } from './PixiTDLevelEditor';
import * as tdLevels from '@/constants/tdLevels';
import { TDLevelData } from '@/engine/tower-defense/types';

export default function TDLevelEditor({ onClose }: { onClose: () => void }) {
  const [selectedLevelKey, setSelectedLevelKey] = useState<string | null>(null);

  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [placementSpots, setPlacementSpots] = useState<
    { x: number; y: number }[]
  >([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

  const availableLevels = useMemo(() => {
    return Object.entries(tdLevels).filter(([key, value]) => {
      const val = value as any;
      return (
        val && Array.isArray(val.path) && Array.isArray(val.placementSpots)
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
      setPathPoints(JSON.parse(JSON.stringify(levelData.path)));
      setPlacementSpots(JSON.parse(JSON.stringify(levelData.placementSpots)));
    } else {
      setPathPoints([]);
      setPlacementSpots([]);
    }
    setSelectedLevelKey(key);
  };

  const handleCreateNew = () => {
    setPathPoints([]);
    setPlacementSpots([]);
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
      setPathPoints((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], x, y };
        return next;
      });
    } else {
      setPlacementSpots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], x, y };
        return next;
      });
    }
  };

  const handlePointDelete = (type: PointType, index: number) => {
    if (type === 'PATH') {
      setPathPoints((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPlacementSpots((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addPathPoint = () => {
    setPathPoints((prev) => [...prev, { x: 50, y: 50 }]);
  };

  const addPlacementSpot = () => {
    setPlacementSpots((prev) => [...prev, { x: 50, y: 50 }]);
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
        path: pathPoints.map((p) => ({
          x: Number(p.x.toFixed(2)),
          y: Number(p.y.toFixed(2)),
        })),
        placementSpots: placementSpots.map((s) => ({
          x: Number(s.x.toFixed(2)),
          y: Number(s.y.toFixed(2)),
        })),
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

      <PixiTDLevelEditor
        pathPoints={pathPoints}
        placementSpots={placementSpots}
        deleteMode={deleteMode}
        onPointMove={handlePointMove}
        onPointDelete={handlePointDelete}
      />
    </div>
  );
}
