import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  SENTICLE,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { BattleContext, BackgroundImageKey, Screens } from '@/types/baseGame';

export default function BattleDebug({ onClose }: { onClose: () => void }) {
  const {
    currentProfileId,
    setScreen,
    enqueueAndProcessEvents,
    addCreatureToProfile,
    createProfile,
    profiles,
    setBattleConfig,
  } = useGameStore();

  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(SENTICLE.id);

  const ensureProfile = () => {
    if (currentProfileId === null) {
      const emptySlot = profiles.findIndex((p) => p === null);
      if (emptySlot !== -1) {
        createProfile(emptySlot);
        return emptySlot;
      } else {
        alert('Please create or select a profile first!');
        return null;
      }
    }
    return currentProfileId;
  };

  const handleStartBattle = (context: BattleContext) => {
    const profileId = ensureProfile();
    if (profileId === null) return;

    enqueueAndProcessEvents([
      {
        type: 'START_BATTLE',
        payload: { context },
      },
    ]);
    onClose();
  };

  const handleQuickBattle = () => {
    const profileId = ensureProfile();
    if (profileId === null) return;

    // For now hardcode Senticle
    const enemy = SENTICLE;

    setBattleConfig(
      {
        enemy,
        backgroundImageKey: BackgroundImageKey.DEFAULT,
        winEvents: [],
        loseEvents: [],
      },
      enemy
    );
    setScreen(Screens.BATTLE);
    onClose();
  };

  const addStarterTeam = () => {
    const profileId = ensureProfile();
    if (profileId === null) return;

    addCreatureToProfile(profileId, {
      ...STARTER_CRAB,
      id: `debug_crab_${Date.now()}`,
    });
    addCreatureToProfile(profileId, {
      ...STARTER_IGUANA,
      id: `debug_iguana_${Date.now()}`,
    });
    addCreatureToProfile(profileId, {
      ...STARTER_MONKEY,
      id: `debug_monkey_${Date.now()}`,
    });
    alert('Added starters to current profile!');
  };

  const addStrongTeam = () => {
    const profileId = ensureProfile();
    if (profileId === null) return;

    const superCrab = {
      ...STARTER_CRAB,
      id: `super_crab_${Date.now()}`,
      name: 'Super Crab',
      level: 50,
      currentHp: 200,
      maxHp: 200,
      attack: 100,
    };
    addCreatureToProfile(profileId, superCrab);
    alert('Added Super Crab!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur text-white font-sans">
      <div className="w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="font-bold text-sm text-slate-300">Battle Debug</h2>
          <button
            onClick={onClose}
            className="px-2 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="space-y-2 p-3 bg-slate-800 rounded border border-slate-700">
            <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">
              Team Setup
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={addStarterTeam}
                className="bg-slate-700 hover:bg-slate-600 px-2 py-2 rounded text-xs text-white"
              >
                Add Starters
              </button>
              <button
                onClick={addStrongTeam}
                className="bg-slate-700 hover:bg-slate-600 px-2 py-2 rounded text-xs text-white"
              >
                Add Super Crab
              </button>
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-800 rounded border border-slate-700">
            <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">
              Defined Battles
            </h3>
            <div className="flex flex-col gap-1">
              {Object.values(BattleContext).map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => handleStartBattle(ctx)}
                  className="bg-slate-900 hover:bg-cyan-900/50 border border-slate-700/50 text-left px-3 py-2 rounded text-xs flex justify-between items-center group transition-colors text-slate-300"
                >
                  <span className="group-hover:text-cyan-200">{ctx}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400/50">
                    Preset
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-800 rounded border border-slate-700">
            <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">
              Quick Battle
            </h3>
            <div className="space-y-2">
              <select
                value={selectedEnemyId}
                onChange={(e) => setSelectedEnemyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300"
              >
                <option value={SENTICLE.id}>Senticle</option>
              </select>
              <button
                onClick={handleQuickBattle}
                className="w-full bg-red-900/40 hover:bg-red-900/80 border border-red-500/30 hover:border-red-500/50 px-3 py-2 rounded text-xs font-bold text-red-100 transition-all"
              >
                FIGHT NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
