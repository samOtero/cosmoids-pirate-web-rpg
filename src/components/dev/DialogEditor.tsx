'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as dialogs from '@/constants/dialogs';
import {
  DialogConfig,
  DialogAction,
  DialogLine,
  DialogButton,
  DialogPortrait,
  SpeakerImageKey,
  BackgroundImageKey,
  DialogButtonType,
  DialogButtonTypeConfig,
  DialogActionType,
  DialogLayout,
} from '@/types/baseGame';
import DialogScreen from '@/app/components/dialogScreen';

// --- Helpers ---

const SPEAKER_OPTIONS = Object.values(SpeakerImageKey);
const BACKGROUND_OPTIONS = Object.values(BackgroundImageKey);
const LAYOUT_OPTIONS: DialogLayout[] = [
  'default',
  'battle-left',
  'battle-right',
];
const BUTTON_TYPE_OPTIONS = Object.keys(
  DialogButtonTypeConfig
) as DialogButtonType[];
const ACTION_TYPE_OPTIONS: DialogActionType[] = ['PROCESS_EVENT'];

const DEFAULT_LINE: DialogLine = {
  text: 'New line...',
  portraits: [],
};

const DEFAULT_PORTRAIT: DialogPortrait = {
  key: SpeakerImageKey.GUIDE,
  displayName: 'Guide',
};

const getDisplayNameForKey = (key: string): string => {
  if (key.startsWith('Lance')) return 'Lance';
  if (key.startsWith('Grandpa')) return 'Grandpa';
  if (key.startsWith('Caleb')) return 'Caleb';
  if (key.startsWith('Hookaw')) return 'Scuttles';
  if (key.startsWith('Pirate_Grunt_Joe')) return 'Grunt Pirate Joe';
  if (key.startsWith('Eel_Senticle')) return 'Senticle';
  if (key === 'Old Sailor') return 'Old Sailor';
  if (key.startsWith('Starter_Chest')) return 'Chest';
  if (key === 'Guide') return 'Guide';
  if (key === 'Crewmate') return 'Crewmate';
  if (key === 'Narrator') return 'Narrator';
  if (key === 'default' || key === 'empty') return '';
  return key;
};

// --- Components ---

function JsonEditor({
  value,
  onChange,
}: {
  value: any;
  onChange: (val: any) => void;
}) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange(parsed);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        className={`flex-1 bg-slate-950 font-mono text-xs p-2 focus:outline-none resize-none ${error ? 'border-red-500 border' : ''}`}
        value={text}
        onChange={handleChange}
        spellCheck={false}
      />
      {error && <div className="text-red-400 text-xs p-1">{error}</div>}
    </div>
  );
}

// --- Main Editor Component ---

export default function DialogEditor({ onClose }: { onClose: () => void }) {
  // Global State
  const [selectedDialogKey, setSelectedDialogKey] = useState<string | null>(
    null
  );

  // Working State (In-Memory Edit)
  // We initialize this when a dialog is selected
  const [workingConfig, setWorkingConfig] = useState<DialogConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // UI State
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [showNewDialogModal, setShowNewDialogModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  // New Dialog Form State
  const [newDialogData, setNewDialogData] = useState({
    fileName: '',
    varName: '',
  });

  // Load Dialogs from Constant Exports
  const availableDialogs = useMemo(() => {
    return Object.entries(dialogs).filter(([_, value]) => {
      const val = value as any;
      return (
        val &&
        typeof val === 'object' &&
        Array.isArray(val.sequence) &&
        val.backgroundImageKey
      );
    }) as [string, DialogConfig][];
  }, []);

  // --- Handlers ---

  const handleSelectDialog = (key: string) => {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return;

    const originalConfig = (dialogs as any)[key] as DialogConfig;
    // Deep copy to break reference
    setWorkingConfig(JSON.parse(JSON.stringify(originalConfig)));
    setSelectedDialogKey(key);
    setSelectedLineIndex(0);
    setIsDirty(false);
    setShowJsonMode(false);
  };

  const handleCreateNew = () => {
    setWorkingConfig({
      sequence: [{ ...DEFAULT_LINE }],
      backgroundImageKey: BackgroundImageKey.DEFAULT,
    });
    setSelectedDialogKey('NEW_DIALOG');
    setNewDialogData({ fileName: '', varName: '' });
    setShowNewDialogModal(true);
    setSelectedLineIndex(0);
    setIsDirty(true);
  };

  const updateWorkingConfig = (newConfig: DialogConfig) => {
    setWorkingConfig(newConfig);
    setIsDirty(true);
  };

  const updateLine = (index: number, newLine: DialogLine) => {
    if (!workingConfig) return;
    const newSequence = [...workingConfig.sequence];
    newSequence[index] = newLine;
    updateWorkingConfig({ ...workingConfig, sequence: newSequence });
  };

  const addLine = () => {
    if (!workingConfig) return;
    const newSequence = [...workingConfig.sequence, { ...DEFAULT_LINE }];
    updateWorkingConfig({ ...workingConfig, sequence: newSequence });
    setSelectedLineIndex(newSequence.length - 1);
  };

  const deleteLine = (index: number) => {
    if (!workingConfig) return;
    if (workingConfig.sequence.length <= 1) {
      alert('Cannot delete the last line.');
      return;
    }
    const newSequence = workingConfig.sequence.filter((_, i) => i !== index);
    updateWorkingConfig({ ...workingConfig, sequence: newSequence });
    if (selectedLineIndex >= newSequence.length) {
      setSelectedLineIndex(newSequence.length - 1);
    }
  };

  const moveLine = (index: number, direction: -1 | 1) => {
    if (!workingConfig) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= workingConfig.sequence.length) return;

    const newSequence = [...workingConfig.sequence];
    const temp = newSequence[index];
    newSequence[index] = newSequence[newIndex];
    newSequence[newIndex] = temp;

    updateWorkingConfig({ ...workingConfig, sequence: newSequence });
    setSelectedLineIndex(newIndex);
  };

  // --- API Actions ---

  const executeSave = async (overrideData?: {
    fileName?: string;
    varName?: string;
  }) => {
    if (!workingConfig) return;

    try {
      setIsSaving(true);
      const fileName = overrideData?.fileName || newDialogData.fileName;
      const dialogName = overrideData?.varName || newDialogData.varName;

      // Validation for new dialogs
      if (selectedDialogKey === 'NEW_DIALOG' && (!fileName || !dialogName)) {
        alert('Please provide a Filename and Variable Name.');
        setIsSaving(false);
        return;
      }

      // If saving an existing dialog, we need its original filename if possible,
      // but our API currently relies on the user providing it or us inferring it.
      // The current API contract seems to assume we pass everything.
      // Wait, existing usage passed `varName: selectedDialogKey`. The API likely looks up the file or overwrites.
      // Let's stick to the previous pattern:

      const payload = {
        fileName: fileName,
        dialogName: dialogName || selectedDialogKey,
        config: workingConfig,
      };

      const res = await fetch('/api/dialogs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      alert('Saved successfully! The app may reload.');
      setIsDirty(false);
      if (selectedDialogKey === 'NEW_DIALOG' && dialogName) {
        setSelectedDialogKey(dialogName); // Switch to the new key
      }
      setShowNewDialogModal(false);
    } catch (error: any) {
      console.error(error);
      alert(`Error saving: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (selectedDialogKey === 'NEW_DIALOG') {
      setShowNewDialogModal(true);
    } else {
      // We don't have the original filename easily available in the list
      // unless we parse it out or the API handles lookup by Export Name.
      // Assuming the previous implementation `executeSave({ varName: selectedDialogKey })` worked,
      // we'll do the same. The API likely finds the file containing the varName.
      executeSave({ varName: selectedDialogKey || '' });
    }
  };

  const handleDelete = async () => {
    if (!selectedDialogKey || selectedDialogKey === 'NEW_DIALOG') return;
    if (!confirm(`Delete "${selectedDialogKey}"?`)) return;

    try {
      const res = await fetch('/api/dialogs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialogKey: selectedDialogKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      alert('Deleted.');
      setSelectedDialogKey(null);
      setWorkingConfig(null);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- Render Helpers ---

  const renderVisualEditor = () => {
    if (!workingConfig) return null;
    const line = workingConfig.sequence[selectedLineIndex];
    if (!line) return <div>No line selected</div>;

    return (
      <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full pb-20">
        {/* Core Line Info */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <h4 className="text-cyan-400 text-xs font-bold uppercase mb-2">
            Text Content
          </h4>
          <textarea
            value={line.text}
            onChange={(e) =>
              updateLine(selectedLineIndex, { ...line, text: e.target.value })
            }
            className="w-full h-24 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
          <div className="mt-2">
            <label className="text-xs text-slate-400 mr-2">
              Line ID (Optional):
            </label>
            <input
              value={line.id || ''}
              onChange={(e) =>
                updateLine(selectedLineIndex, { ...line, id: e.target.value })
              }
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 w-40"
              placeholder="unique-id"
            />
          </div>
          <div className="mt-2">
            <label className="text-xs text-slate-400 mr-2">Layout:</label>
            <select
              value={line.layout || 'default'}
              onChange={(e) =>
                updateLine(selectedLineIndex, {
                  ...line,
                  layout: e.target.value as DialogLayout,
                })
              }
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Portraits */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-cyan-400 text-xs font-bold uppercase">
              Portraits
            </h4>
            <button
              onClick={() =>
                updateLine(selectedLineIndex, {
                  ...line,
                  portraits: [...line.portraits, { ...DEFAULT_PORTRAIT }],
                })
              }
              className="text-xs bg-cyan-700 px-2 py-1 rounded text-white hover:bg-cyan-600"
            >
              + Add Portrait
            </button>
          </div>

          <div className="space-y-3">
            {line.portraits.map((portrait, pIdx) => (
              <div
                key={pIdx}
                className="bg-slate-900 p-2 rounded flex flex-col gap-2 relative border border-slate-700/50"
              >
                <button
                  onClick={() => {
                    const newPortraits = line.portraits.filter(
                      (_, i) => i !== pIdx
                    );
                    updateLine(selectedLineIndex, {
                      ...line,
                      portraits: newPortraits,
                    });
                  }}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-400 text-xs px-1"
                >
                  ✕
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Character
                    </label>
                    <select
                      value={portrait.key}
                      onChange={(e) => {
                        const newKey = e.target.value as SpeakerImageKey;
                        const newPortraits = [...line.portraits];
                        newPortraits[pIdx] = {
                          ...portrait,
                          key: newKey,
                          displayName: getDisplayNameForKey(newKey),
                        };
                        updateLine(selectedLineIndex, {
                          ...line,
                          portraits: newPortraits,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    >
                      {SPEAKER_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Display Name
                    </label>
                    <input
                      value={portrait.displayName}
                      onChange={(e) => {
                        const newPortraits = [...line.portraits];
                        newPortraits[pIdx] = {
                          ...portrait,
                          displayName: e.target.value,
                        };
                        updateLine(selectedLineIndex, {
                          ...line,
                          portraits: newPortraits,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Size
                    </label>
                    <select
                      value={portrait.portraitWidth || 'normal'}
                      onChange={(e) => {
                        const newPortraits = [...line.portraits];
                        newPortraits[pIdx] = {
                          ...portrait,
                          portraitWidth: e.target.value as 'normal' | 'wide',
                        };
                        updateLine(selectedLineIndex, {
                          ...line,
                          portraits: newPortraits,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {line.portraits.length === 0 && (
              <p className="text-xs text-slate-500 italic">
                No portraits (Narrator mode)
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-cyan-400 text-xs font-bold uppercase">
              Response Buttons
            </h4>
            <button
              onClick={() =>
                updateLine(selectedLineIndex, {
                  ...line,
                  buttons: [
                    ...(line.buttons || []),
                    { label: 'Continue', type: 'confirm' },
                  ],
                })
              }
              className="text-xs bg-cyan-700 px-2 py-1 rounded text-white hover:bg-cyan-600"
            >
              + Add Button
            </button>
          </div>

          <div className="space-y-3">
            {line.buttons?.map((btn, bIdx) => (
              <div
                key={bIdx}
                className="bg-slate-900 p-2 rounded flex flex-col gap-2 relative border border-slate-700/50"
              >
                <button
                  onClick={() => {
                    const newButtons = line.buttons?.filter(
                      (_, i) => i !== bIdx
                    );
                    updateLine(selectedLineIndex, {
                      ...line,
                      buttons: newButtons,
                    });
                  }}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-400 text-xs px-1"
                >
                  ✕
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Label
                    </label>
                    <input
                      value={btn.label}
                      onChange={(e) => {
                        const newButtons = [...(line.buttons || [])];
                        newButtons[bIdx] = { ...btn, label: e.target.value };
                        updateLine(selectedLineIndex, {
                          ...line,
                          buttons: newButtons,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Type (Color)
                    </label>
                    <select
                      value={btn.type}
                      onChange={(e) => {
                        const newButtons = [...(line.buttons || [])];
                        newButtons[bIdx] = {
                          ...btn,
                          type: e.target.value as DialogButtonType,
                        };
                        updateLine(selectedLineIndex, {
                          ...line,
                          buttons: newButtons,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    >
                      {BUTTON_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Jump to Line ID
                    </label>
                    <input
                      value={btn.jumpToLineId || ''}
                      onChange={(e) => {
                        const newButtons = [...(line.buttons || [])];
                        newButtons[bIdx] = {
                          ...btn,
                          jumpToLineId: e.target.value,
                        };
                        updateLine(selectedLineIndex, {
                          ...line,
                          buttons: newButtons,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                      placeholder="Optional ID"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Action Type
                    </label>
                    <select
                      value={btn.action?.type || ''}
                      onChange={(e) => {
                        const newButtons = [...(line.buttons || [])];
                        if (!e.target.value) {
                          delete newButtons[bIdx].action;
                        } else {
                          newButtons[bIdx].action = {
                            type: e.target.value as DialogActionType,
                            payload: newButtons[bIdx].action?.payload || {
                              event: {
                                type: 'SHOW_DIALOG',
                                payload: {
                                  context: 'NEW_PLAYER_WELCOME_DIALOG' as any,
                                },
                              },
                            },
                          };
                        }
                        updateLine(selectedLineIndex, {
                          ...line,
                          buttons: newButtons,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                    >
                      <option value="">(None)</option>
                      {ACTION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {(!line.buttons || line.buttons.length === 0) && (
              <p className="text-xs text-slate-500 italic">
                No buttons (Standard click-to-continue)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur text-white font-sans">
      <div className="w-full h-full flex overflow-hidden">
        {/* PANEL 1: Dialog List (Left) */}
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h2 className="font-bold text-sm text-slate-300">Dialogs</h2>
            <div className="flex gap-1">
              <button
                onClick={handleCreateNew}
                className="text-xs bg-cyan-700 hover:bg-cyan-600 px-2 py-1 rounded text-white"
              >
                + New
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white px-2"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {availableDialogs.map(([key]) => (
              <button
                key={key}
                onClick={() => handleSelectDialog(key)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-mono mb-1 truncate transition-colors ${
                  selectedDialogKey === key
                    ? 'bg-cyan-900 text-cyan-100'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 2: Sequence Inspector (Middle) */}
        <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-950">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
              Sequence Inspector
            </h3>
            {/* Global Settings for Dialog */}
            {workingConfig && (
              <div className="mb-2">
                <label className="text-xs text-slate-500">Background</label>
                <select
                  value={workingConfig.backgroundImageKey}
                  onChange={(e) =>
                    updateWorkingConfig({
                      ...workingConfig,
                      backgroundImageKey: e.target.value as BackgroundImageKey,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded text-xs p-1 mt-1 text-slate-300"
                >
                  {BACKGROUND_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {workingConfig ? (
              workingConfig.sequence.map((line, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLineIndex(idx)}
                  className={`p-2 rounded border cursor-pointer relative group ${
                    selectedLineIndex === idx
                      ? 'bg-slate-800 border-cyan-600/50'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      #{idx}
                    </span>
                    {line.id && (
                      <span className="text-[10px] bg-purple-900/50 text-purple-200 px-1 rounded">
                        {line.id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {line.text}
                  </p>

                  <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLine(idx, -1);
                      }}
                      className="p-1 hover:text-cyan-400 text-slate-600"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLine(idx, 1);
                      }}
                      className="p-1 hover:text-cyan-400 text-slate-600"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLine(idx);
                      }}
                      className="p-1 hover:text-red-400 text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-600 text-xs mt-10">
                Select a dialog
              </div>
            )}
          </div>

          {workingConfig && (
            <div className="p-2 border-t border-slate-800">
              <button
                onClick={addLine}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700 flex justify-center items-center gap-2"
              >
                <span>+ Add Line</span>
              </button>
            </div>
          )}
        </div>

        {/* PANEL 3: Workspace (Right) */}
        <div className="flex-1 flex flex-col bg-black min-w-0 transition-all duration-300">
          {/* Visual Preview (Top) */}
          <div
            className={`${isEditorCollapsed ? 'flex-1' : 'h-1/2'} relative border-b border-slate-800 overflow-hidden bg-gray-900 transition-all duration-300`}
          >
            <div className="absolute top-2 left-2 z-20 bg-black/50 px-2 py-1 rounded text-[10px] text-slate-400 font-mono uppercase">
              Preview Mode
            </div>
            {workingConfig && (
              <div className="w-full h-full transform scale-90 origin-center">
                {' '}
                {/* Slight scale down to fit ui comfortably */}
                <DialogScreen
                  sequence={workingConfig.sequence}
                  backgroundImageKey={workingConfig.backgroundImageKey}
                  initialLineIndex={selectedLineIndex}
                  isLoading={false}
                  onContinue={() => {}} // No-op in preview
                  onDialogAction={() => {}}
                  // We use key to force re-mounting if sequence length changes drastically,
                  // but for simple updates passing props is enough.
                  // Actually, DialogScreen is stateful for typewriter.
                  // If we want to preview specific line without typing every char change, we might need a "Preview Toggle" or just accept it.
                  // Let's try key={selectedLineIndex} to snap to that line fresh.
                  key={`${selectedDialogKey}-${selectedLineIndex}-${workingConfig.sequence.length}`}
                />
              </div>
            )}
            {!workingConfig && (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                No Preview
              </div>
            )}
          </div>

          {/* Editor (Bottom) */}
          <div
            className={`${isEditorCollapsed ? 'h-10' : 'h-1/2'} flex flex-col min-h-0 bg-slate-900 transition-all duration-300`}
          >
            {/* Toolbar */}
            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
                  className="text-slate-500 hover:text-white mr-2"
                  title={
                    isEditorCollapsed ? 'Expand Editor' : 'Minimize Editor'
                  }
                >
                  {isEditorCollapsed ? '▲' : '▼'}
                </button>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Line Editor
                </h3>
                {!isEditorCollapsed && (
                  <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                    <button
                      onClick={() => setShowJsonMode(false)}
                      className={`px-3 py-1 text-[10px] rounded ${!showJsonMode ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Visual
                    </button>
                    <button
                      onClick={() => setShowJsonMode(true)}
                      className={`px-3 py-1 text-[10px] rounded ${showJsonMode ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      JSON
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="text-xs text-orange-400 italic mr-2">
                    Unsaved Changes
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !workingConfig}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Dialog'}
                </button>
                {selectedDialogKey && selectedDialogKey !== 'NEW_DIALOG' && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded border border-red-900/50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Edit Content */}
            {!isEditorCollapsed && (
              <div className="flex-1 min-h-0">
                {showJsonMode ? (
                  <div className="h-full p-4">
                    <JsonEditor
                      value={workingConfig}
                      onChange={(val) => {
                        setWorkingConfig(val);
                        setIsDirty(true);
                      }}
                    />
                  </div>
                ) : (
                  renderVisualEditor()
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save As Modal */}
      {showNewDialogModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
          <div className="bg-slate-800 p-6 rounded border border-slate-600 w-96 shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-white">
              Save New Dialog
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
                  Filename
                </label>
                <input
                  value={newDialogData.fileName}
                  onChange={(e) =>
                    setNewDialogData((prev) => ({
                      ...prev,
                      fileName: e.target.value,
                    }))
                  }
                  placeholder="e.g. introSequence"
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
                  Variable Name (Export)
                </label>
                <input
                  value={newDialogData.varName}
                  onChange={(e) =>
                    setNewDialogData((prev) => ({
                      ...prev,
                      varName: e.target.value,
                    }))
                  }
                  placeholder="e.g. INTRO_SEQUENCE"
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewDialogModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => executeSave()}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 font-bold text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
