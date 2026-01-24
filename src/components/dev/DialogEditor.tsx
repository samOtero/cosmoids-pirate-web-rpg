"use client";

import React, { useState, useMemo } from "react";
import * as dialogs from "@/constants/dialogs";
import { DialogConfig, DialogAction, DialogLine, DialogButton, DialogPortrait, SpeakerImageKey, BackgroundImageKey } from "@/types/baseGame";
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

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNewDialogModal, setShowNewDialogModal] = useState(false);
  const [newDialogData, setNewDialogData] = useState({ fileName: "", varName: "" });

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
    setIsEditing(false); // Reset edit mode
    // Pre-populate edit JSON just in case they switch to edit mode
    // We can't do this here accurately because `availableDialogs` might change, 
    // better to derive it when entering edit mode or via useEffect if needed.
  };

  const handleStartEdit = () => {
    if (!selectedDialog) return;
    setEditJson(JSON.stringify(selectedDialog, null, 2));
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
        const parsed = JSON.parse(editJson);
        // We need a filename and variable name.
        // For existing dialogs, we might not know the filename easily without metadata.
        // For this "Add new dialog" feature, it's most important for NEW ones.
        // BUT, if we are editing an existing one, we are kind of stuck unless we ask for the filename again
        // OR we just allow "Save Copy As..." for now.
        // Let's implement "Save Copy" or if it was just created, we might know.
        // Simpler for now: "Save to File" button that always asks/confirms details?
        // Or better: Just "Save" that overwrites if we know the key, but we don't know the file...
        // Let's rely on the New Dialog flow explicitly for "creating", and maybe an explicit "Save Changes" that asks for filename.
        setShowNewDialogModal(true);
        // We'll use the modal to confirm save details
    } catch (e) {
        alert("Invalid JSON");
    }
  };

  const executeSave = async () => {
    try {
        setIsSaving(true);
        const config = JSON.parse(editJson);
        const res = await fetch("/api/dialogs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: newDialogData.fileName,
                dialogName: newDialogData.varName,
                config
            })
        });
        
        if (!res.ok) throw new Error("Failed to save");
        
        alert("Saved successfully! The app may reload.");
        setShowNewDialogModal(false);
    } catch (error) {
        console.error(error);
        alert("Error saving");
    } finally {
        setIsSaving(false);
    }
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
               <div className="flex items-center gap-2">
                 <h2 className="font-bold text-lg">Dialogs</h2>
                 <button 
                   onClick={() => {
                        setEditJson(JSON.stringify({
                            sequence: [
                                {
                                    text: "New dialog text...",
                                    portraits: [{ key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT, displayName: "Guide" }]
                                }
                            ],
                            backgroundImageKey: BackgroundImageKey.CALEB_HOUSE
                        }, null, 2));
                        setSelectedDialogKey("NEW_DIALOG"); // Placeholder
                        setIsEditing(true);
                        setStartLineIndex(0);
                        setShowNewDialogModal(true);
                   }}
                   className="text-xs bg-cyan-600 px-2 py-1 rounded hover:bg-cyan-500"
                 >
                    + New
                 </button>
               </div>
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
            
            {selectedDialogKey && (
                <div className="flex gap-2">
                    {!isEditing && (
                        <button
                            onClick={handleStartEdit}
                            className="px-3 py-1 bg-purple-600 text-xs rounded hover:bg-purple-500"
                        >
                            Edit JSON
                        </button>
                    )}
                    {isEditing && (
                         <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewDialogModal(true)}
                                className="px-3 py-1 bg-green-600 text-xs rounded hover:bg-green-500"
                            >
                                Save to File...
                            </button>
                             <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 bg-slate-700 text-xs rounded hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                         </div>
                    )}
                </div>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden bg-black">
            {isEditing ? (
                 <div className="h-full w-full flex flex-col">
                    <div className="bg-slate-900 p-2 text-xs text-slate-400 border-b border-slate-800">
                        Edit raw JSON. <span className="text-cyan-400">Tip:</span> Use string values (e.g. "Guide"). They will be automatically converted to Enums on save.
                    </div>
                    <textarea 
                        className="flex-1 bg-slate-950 text-slate-300 font-mono text-sm p-4 focus:outline-none resize-none"
                        value={editJson}
                        onChange={(e) => setEditJson(e.target.value)}
                        spellCheck={false}
                    />
                 </div>
            ) : selectedDialog ? (
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
      {/* New/Save Dialog Modal */}
      {showNewDialogModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 w-96 shadow-xl">
                <h3 className="font-bold text-lg mb-4">Save Dialog</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
                            Current Key (display only)
                        </label>
                         <input 
                            disabled
                            value={selectedDialogKey || "NEW"}
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
                            Filename (no extension)
                        </label>
                        <input 
                            value={newDialogData.fileName}
                            onChange={e => setNewDialogData(prev => ({...prev, fileName: e.target.value}))}
                            placeholder="e.g. myNewDialog"
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
                            Variable Name (Export)
                        </label>
                        <input 
                            value={newDialogData.varName}
                             onChange={e => setNewDialogData(prev => ({...prev, varName: e.target.value}))}
                            placeholder="e.g. MY_NEW_DIALOG"
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded focus:border-cyan-500 focus:outline-none"
                        />
                         <p className="text-xs text-slate-500 mt-1">This will be the exported constant name.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button 
                        onClick={() => setShowNewDialogModal(false)}
                        className="px-4 py-2 text-slate-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeSave}
                        disabled={isSaving || !newDialogData.fileName || !newDialogData.varName}
                        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Saving..." : "Save File"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
