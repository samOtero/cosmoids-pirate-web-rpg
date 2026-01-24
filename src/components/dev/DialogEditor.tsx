"use client";

import React, { useState, useMemo } from "react";
import * as dialogs from "@/constants/dialogs";
import { DialogConfig } from "@/types/baseGame";

export default function DialogEditor({ onClose }: { onClose: () => void }) {
  const [selectedDialogKey, setSelectedDialogKey] = useState<string | null>(
    null
  );

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
                onClick={() => setSelectedDialogKey(key)}
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
        <div className="w-2/3 flex flex-col bg-slate-950">
          <div className="p-4 border-b border-slate-700 bg-slate-900 h-14 flex items-center">
            {selectedDialogKey ? (
              <h3 className="font-mono text-cyan-400">{selectedDialogKey}</h3>
            ) : (
              <span className="text-slate-500 italic">
                Select a dialog to view
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDialog ? (
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(selectedDialog, null, 2)}
              </pre>
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
