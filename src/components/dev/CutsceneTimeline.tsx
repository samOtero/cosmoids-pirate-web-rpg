import React from 'react';
import { CutsceneData, CutsceneKeyframe } from '@/types/cutscene';
import { Creature } from '@/types/baseGame';

interface Props {
  data: CutsceneData;
  setData: (data: CutsceneData) => void;
  currentTimeMs: number;
  setCurrentTimeMs: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  creaturesRecord: Record<string, Creature>;
}

export default function CutsceneTimeline({
  data,
  setData,
  currentTimeMs,
  setCurrentTimeMs,
  isPlaying,
  setIsPlaying,
  creaturesRecord,
}: Props) {
  const durationMs = data.durationMs;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    setCurrentTimeMs(Math.round(progress * durationMs));
  };

  const addKeyframe = (unitId: string, timeMs: number) => {
    setData({
      ...data,
      units: data.units.map((u) => {
        if (u.id !== unitId) return u;
        const existing = u.keyframes.find((k) => k.timeMs === timeMs);
        if (existing) return u;

        const newKf: CutsceneKeyframe = {
          timeMs,
          x: 400,
          y: 225,
          scale: 1,
          facingRight: true,
          opacity: 1,
        };

        return {
          ...u,
          keyframes: [...u.keyframes, newKf].sort(
            (a, b) => a.timeMs - b.timeMs
          ),
        };
      }),
    });
  };

  const deleteKeyframe = (unitId: string, kfTimeMs: number) => {
    setData({
      ...data,
      units: data.units.map((u) => {
        if (u.id !== unitId) return u;
        return {
          ...u,
          keyframes: u.keyframes.filter((k) => k.timeMs !== kfTimeMs),
        };
      }),
    });
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-900 border-t border-slate-700 p-4 overflow-y-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-6 py-2 font-bold text-white rounded shadow ${isPlaying ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'}`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="text-mono text-slate-300 font-mono text-lg">
          {(currentTimeMs / 1000).toFixed(2)}s /{' '}
          {(durationMs / 1000).toFixed(2)}s
        </div>
      </div>

      <div
        className="relative h-8 bg-slate-800 border-x border-slate-600 cursor-pointer mb-2 ml-[200px] flex-1"
        onClick={handleTimelineClick}
      >
        <div
          className="absolute top-0 bottom-0 bg-red-500/30 border-r-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-20 pointer-events-none"
          style={{ width: `${(currentTimeMs / durationMs) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-2 relative">
        {data.units.map((unit) => {
          const creature = creaturesRecord[unit.speciesId];
          return (
            <div
              key={unit.id}
              className="flex h-12 bg-slate-800 border border-slate-700 items-center rounded overflow-hidden"
            >
              <div className="w-[200px] shrink-0 p-2 border-r border-slate-700 flex justify-between items-center text-sm font-bold text-slate-300 bg-slate-800 z-10">
                <span className="truncate pr-2">
                  {creature?.name || unit.speciesId}
                </span>
                <button
                  onClick={() => addKeyframe(unit.id, currentTimeMs)}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-2 py-1 rounded shadow"
                >
                  +KF
                </button>
              </div>
              <div
                className="flex-1 relative h-full bg-slate-800/50"
                onClick={handleTimelineClick}
              >
                {unit.keyframes.map((kf) => {
                  const left = `${(kf.timeMs / durationMs) * 100}%`;
                  const isActive = kf.timeMs === currentTimeMs;
                  return (
                    <div
                      key={kf.timeMs}
                      className={`absolute w-4 h-4 -ml-2 top-1/2 -translate-y-1/2 rotate-45 cursor-pointer z-30 border-2 shadow-md ${isActive ? 'bg-yellow-400 border-yellow-200 scale-125' : 'bg-cyan-400 border-cyan-200'} hover:scale-150 transition-transform`}
                      style={{ left }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTimeMs(kf.timeMs);
                      }}
                      onAuxClick={(e) => {
                        e.stopPropagation();
                        deleteKeyframe(unit.id, kf.timeMs);
                      }}
                      title={`Right click/middle click to delete. Keyframe at ${kf.timeMs}ms`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {data.units.length === 0 && (
          <div className="text-slate-500 italic p-4 text-center">
            No units added yet. Add a unit from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}
