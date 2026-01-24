"use client";

import React, { useState, useMemo } from "react";
import * as dialogs from "@/constants/dialogs";
import { DialogConfig, DialogAction } from "@/types/baseGame";
import DialogScreen from "@/app/components/dialogScreen";

export default function DialogEditor({ onClose }: { onClose: () => void }) {
  const [selectedDialogKey, setSelectedDialogKey] = useState<string | null>(
    null
  );
  // Key to force re-mounting of DialogScreen to reset state
  const [playKey, setPlayKey] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);

  // Filter exports to find valid DialogConfigs
  const availableDialogs = useMemo(() => {
    return Object.entries(dialogs).filter(([_, value]) => {
      // Basic duck typing to check if it looks like a DialogConfig
      const val = value as any;
      return (
        val &&
        typeof val === "object" &&
        Array.isArray(val.sequence) &&
        val.backgroundImageKey
      );
    }) as [string, DialogConfig][];
  }, []);

  const selectedDialog = selectedDialogKey
    ? (dialogs as any)[selectedDialogKey]
    : null;

  const handleRestart = () => {
    setPlayKey((prev) => prev + 1);
    setIsFinished(false);
  };

  const handleSelect = (key: string) => {
    setSelectedDialogKey(key);
    setPlayKey(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-white">
      <div className="bg-slate-900 border border-slate-700 w-full h-full max-w-6xl flex shadow-2xl rounded-lg overflow-hidden">
        {/* Sidebar: List of Dialogs */}
        <div className="w-1/3 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
            <h2 className="font-bold text-lg">Dialogs</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {availableDialogs.map(([key]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`w-full text-left px-4 py-2 rounded text-sm font-mono transition-colors ${
                  selectedDialogKey === key
                    ? "bg-cyan-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Main Area: Logic/Preview */}
        <div className="w-2/3 flex flex-col bg-slate-950 relative">
          <div className="p-4 border-b border-slate-700 bg-slate-900 h-14 flex items-center justify-between z-20">
            {selectedDialogKey ? (
              <>
                <h3 className="font-mono text-cyan-400">{selectedDialogKey}</h3>
                <button 
                  onClick={handleRestart}
                  className="px-3 py-1 bg-slate-700 text-xs rounded hover:bg-slate-600"
                >
                  Restart
                </button>
              </>
            ) : (
              <span className="text-slate-500 italic">
                Select a dialog to view
              </span>
            )}
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-black">
            {selectedDialog ? (
              <div key={`${selectedDialogKey}-${playKey}`} className="h-full w-full">
                {isFinished ? (
                   <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <p>Dialog Sequence Completed</p>
                      <button 
                        onClick={handleRestart}
                        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 font-bold"
                      >
                        Replay
                      </button>
                   </div>
                ) : (
                  <DialogScreen
                    sequence={selectedDialog.sequence}
                    backgroundImageKey={selectedDialog.backgroundImageKey}
                    onContinue={() => setIsFinished(true)}
                    onDialogAction={(action) => {
                      console.log("[DialogEditor] Action triggered:", action);
                      alert(`Action triggered: ${action.type}`);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600">
                <p>No dialog selected</p>
              </div>
            )}
          </div>
          
          {/* Debug Info Overlay */}
          {selectedDialog && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs font-mono text-slate-400 border-t border-slate-800 z-10 max-h-32 overflow-auto">
                <p>Background: {selectedDialog.backgroundImageKey}</p>
                <p>Next Screen: {selectedDialog.next?.screen}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
