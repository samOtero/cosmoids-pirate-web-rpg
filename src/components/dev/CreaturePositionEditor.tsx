'use client';

import React, { useState } from 'react';
import {
  SENTICLE,
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
  MOUSE_1,
} from '@/constants/creatures';
import { BATTLE_BACKGROUND_IMAGES } from '@/constants/game';
import { BackgroundImageKey, Creature } from '@/types/baseGame';
import { BattleScreenUI } from '@/app/components/battleScreen';

// Map variable names to creatures for both display and saving
const ALL_CREATURES: { varName: string; creature: Creature }[] = [
  { varName: 'SENTICLE', creature: SENTICLE },
  { varName: 'BUG_STAGE_1', creature: BUG_STAGE_1 },
  { varName: 'BUG_STAGE_2', creature: BUG_STAGE_2 },
  { varName: 'BUG_STAGE_3', creature: BUG_STAGE_3 },
  { varName: 'STARTER_CRAB', creature: STARTER_CRAB },
  { varName: 'STARTER_IGUANA', creature: STARTER_IGUANA },
  { varName: 'STARTER_MONKEY', creature: STARTER_MONKEY },
  { varName: 'MOUSE_1', creature: MOUSE_1 },
];

type Side = 'left' | 'right';

export default function CreaturePositionEditor({
  onClose,
}: {
  onClose: () => void;
}) {
  const [side, setSide] = useState<Side>('left');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [oppositeIndex, setOppositeIndex] = useState(1);
  const [bgKey, setBgKey] = useState<BackgroundImageKey>(
    BackgroundImageKey.DEFAULT
  );

  const selectedEntry = ALL_CREATURES[selectedIndex];
  const creature = selectedEntry.creature;

  // Position state – initialized from creature data or defaults
  const [bottom, setBottom] = useState(
    creature.battlePosition?.bottom ?? (side === 'left' ? 2 : 5)
  );
  const [left, setLeft] = useState(
    creature.battlePosition?.left ?? (side === 'left' ? 20 : 20)
  );
  const [scale, setScale] = useState(creature.battleScale ?? 1);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // When creature selection changes, load its saved values
  const handleCreatureChange = (index: number) => {
    setSelectedIndex(index);
    const c = ALL_CREATURES[index].creature;
    setBottom(c.battlePosition?.bottom ?? (side === 'left' ? 2 : 5));
    setLeft(c.battlePosition?.left ?? (side === 'left' ? 20 : 20));
    setScale(c.battleScale ?? 1);
  };

  const handleSideChange = (newSide: Side) => {
    setSide(newSide);
    // Reset to defaults for the new side if no saved position
    const c = ALL_CREATURES[selectedIndex].creature;
    if (!c.battlePosition) {
      setBottom(newSide === 'left' ? 2 : 5);
      setLeft(newSide === 'left' ? 20 : 20);
    }
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
          battlePosition: { bottom, left },
          battleScale: scale,
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

  const bgUrl =
    BATTLE_BACKGROUND_IMAGES[bgKey] ||
    BATTLE_BACKGROUND_IMAGES[BackgroundImageKey.DEFAULT];

  // Build a creature with the editor's live position/scale values
  const previewCreature: Creature = {
    ...creature,
    battlePosition: { bottom, left },
    battleScale: scale,
  };

  // The opposite creature uses its own saved position/scale (read-only)
  const oppositeCreature = ALL_CREATURES[oppositeIndex].creature;

  // Build player + enemy creatures for the BattleScreenUI
  const playerCreature = side === 'left' ? previewCreature : oppositeCreature;
  const enemyCreature = side === 'right' ? previewCreature : oppositeCreature;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-700 shrink-0">
        <h2 className="font-bold text-sm text-slate-300">
          Creature Position Editor
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
          {/* Side Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Side
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => handleSideChange('left')}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition ${
                  side === 'left'
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Left (Player)
              </button>
              <button
                onClick={() => handleSideChange('right')}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition ${
                  side === 'right'
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Right (Enemy)
              </button>
            </div>
          </div>

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

          {/* Opposite Creature Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Opposite Creature
            </label>
            <select
              value={oppositeIndex}
              onChange={(e) => setOppositeIndex(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {ALL_CREATURES.map((entry, i) => (
                <option key={entry.varName} value={i}>
                  {entry.creature.name} ({entry.varName})
                </option>
              ))}
            </select>
          </div>

          {/* Background Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Background
            </label>
            <select
              value={bgKey}
              onChange={(e) => setBgKey(e.target.value as BackgroundImageKey)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {Object.values(BackgroundImageKey).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Position & Scale
            </label>

            {/* Bottom */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Bottom</span>
                <span className="font-mono text-cyan-400">{bottom}%</span>
              </div>
              <input
                type="range"
                min={-10}
                max={80}
                step={0.5}
                value={bottom}
                onChange={(e) => setBottom(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>

            {/* Left/Right */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{side === 'left' ? 'Left' : 'Right'}</span>
                <span className="font-mono text-cyan-400">{left}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={0.5}
                value={left}
                onChange={(e) => setLeft(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2"
              />
            </div>

            {/* Scale */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Scale</span>
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
                  battlePosition: { bottom, left },
                  battleScale: scale,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Preview Area — renders the real BattleScreenUI */}
        <div className="flex-1 relative overflow-hidden">
          <BattleScreenUI
            playerCreature={playerCreature}
            enemyCreature={enemyCreature}
            onAttack={() => {}}
            onHeal={() => {}}
            onRun={() => {}}
            battleLog={[]}
            isPlayerTurn={false}
            battleOver={true}
            inventory={[]}
            onOpenBag={() => {}}
            backgroundImageUrl={bgUrl}
          />

          {/* Crosshair Guide */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
          </div>

          {/* Info Overlay */}
          <div className="absolute top-3 left-3 z-30 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <p className="text-[10px] text-slate-400">
              {creature.name} • {side === 'left' ? 'Player' : 'Enemy'} side •
              Uses real BattleScreenUI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
