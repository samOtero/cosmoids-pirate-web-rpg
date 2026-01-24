"use client";

import React, { useState, useMemo } from "react";
import * as dialogs from "@/constants/dialogs";
import { DialogConfig, DialogAction, DialogLine, DialogButton, DialogPortrait } from "@/types/baseGame";
import DialogScreen from "@/app/components/dialogScreen";

export default function DialogEditor({ onClose }: { onClose: () => void }) {
  const [selectedDialogKey, setSelectedDialogKey] = useState<string | null>(
    null
  );
  // Key to force re-mounting of DialogScreen to reset state
  const [playKey, setPlayKey] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [startLineIndex, setStartLineIndex] = useState(0);

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
    ? ((dialogs as any)[selectedDialogKey] as DialogConfig)
    : null;

  const handleRestart = () => {
    setStartLineIndex(0);
    setPlayKey((prev) => prev + 1);
    setIsFinished(false);
  };

  const handleSelect = (key: string) => {
    setSelectedDialogKey(key);
    setStartLineIndex(0);
    setPlayKey(0);
    setIsFinished(false);
  };

  const handleJumpToLine = (index: number) => {
    setStartLineIndex(index);
    setPlayKey((prev) => prev + 1);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-white">
      <div className="bg-slate-900 border border-slate-700 w-full h-full flex shadow-2xl rounded-lg overflow-hidden">
        {/* Sidebar: List + Inspector */}
        <div className="w-1/3 border-r border-slate-700 flex flex-col min-h-0 bg-slate-900">
          {/* Top: List of Dialogs */}
          <div className={`${isInspectorOpen ? "h-1/2 border-b border-slate-700" : "flex-1"} flex flex-col min-h-0 transition-all duration-300`}>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
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

          {/* Bottom: Sequence Inspector */}
          <div className={`${isInspectorOpen ? "h-1/2" : "h-10"} flex flex-col min-h-0 transition-all duration-300 bg-slate-900 border-t border-slate-700`}>
             <button 
               onClick={() => setIsInspectorOpen(!isInspectorOpen)}
               className="p-2 border-b border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 flex justify-between items-center shrink-0 hover:bg-slate-700 transition-colors"
             >
                <div className="flex items-center gap-2">
                   <span>{isInspectorOpen ? "▼" : "▲"} Sequence Inspector</span>
                </div>
                <span className="text-xs text-slate-500">
                  {selectedDialog ? `${selectedDialog.sequence.length} lines` : ""}
                </span>
             </button>
             
             {isInspectorOpen && (
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {selectedDialog ? (
                   selectedDialog.sequence.map((line, idx) => (
                     <div
                       key={idx}
                       onClick={() => handleJumpToLine(idx)}
                       className="bg-slate-800 border border-slate-700 rounded p-3 text-sm relative cursor-pointer hover:bg-slate-700 transition-colors"
                     >
                       <div className="absolute top-2 right-2 text-slate-500 text-xs font-mono">
                         #{idx}
                       </div>
                       {line.id && (
                         <div className="mb-1">
                           <span className="bg-purple-900 text-purple-200 text-xs px-2 py-0.5 rounded font-mono">
                             ID: {line.id}
                           </span>
                         </div>
                       )}
                       <div className="flex gap-2 mb-2">
                         {line.portraits.map((p, pIdx) => (
                           <span
                             key={pIdx}
                             className="text-cyan-400 font-bold text-xs uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded"
                           >
                             {p.displayName}
                           </span>
                         ))}
                       </div>
                       <div className="text-slate-300 mb-2 leading-relaxed">
                         {line.text}
                       </div>
                       {line.buttons && line.buttons.length > 0 && (
                         <div className="mt-2 pt-2 border-t border-slate-700">
                           <p className="text-xs text-slate-500 mb-1">Buttons:</p>
                           <div className="flex flex-wrap gap-2">
                             {line.buttons.map((btn, bIdx) => (
                               <div
                                 key={bIdx}
                                 className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                               >
                                 <span className="text-white font-bold mr-2">
                                   [{btn.label}]
                                 </span>
                                 {btn.jumpToLineId && (
                                   <span className="text-orange-400 mr-2">
                                     → Jump: {btn.jumpToLineId}
                                   </span>
                                 )}
                                 {btn.action && (
                                   <span className="text-green-400">
                                     → Action: {btn.action.type}
                                   </span>
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   ))
                 ) : (
                   <div className="text-center text-slate-600 mt-10">
                     Select a dialog to inspect its sequence
                   </div>
                 )}
               </div>
             )}
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
              <div
                key={`${selectedDialogKey}-${playKey}`}
                className="h-full w-full"
              >
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
                    initialLineIndex={startLineIndex}
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
        </div>
      </div>
    </div>
  );
}
