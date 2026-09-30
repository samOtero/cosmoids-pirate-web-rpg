'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useEditorSource } from './useEditorSource';
import EditorSourceStatus from './EditorSourceStatus';
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
  if (key.startsWith('Maribel')) return 'Mari';
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
    <div className="flex h-full flex-col">
      <textarea
        className={`flex-1 resize-none bg-slate-950 p-2 font-mono text-xs focus:outline-none ${error ? 'border border-red-500' : ''}`}
        value={text}
        onChange={handleChange}
        spellCheck={false}
      />
      {error && <div className="p-1 text-xs text-red-400">{error}</div>}
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
  const source = useEditorSource<DialogConfig>(
    'dialog',
    selectedDialogKey === 'NEW_DIALOG' ? null : selectedDialogKey,
    (config) => {
      setWorkingConfig(config);
      setIsDirty(false);
    }
  );

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
      const fileName =
        overrideData?.fileName ||
        (selectedDialogKey === 'NEW_DIALOG'
          ? newDialogData.fileName
          : undefined);
      const dialogName = overrideData?.varName || newDialogData.varName;

      // Validation for new dialogs
      if (selectedDialogKey === 'NEW_DIALOG' && (!fileName || !dialogName)) {
        alert('Please provide a Filename and Variable Name.');
        setIsSaving(false);
        return;
      }

      const payload = {
        fileName: fileName,
        dialogName: dialogName || selectedDialogKey,
        config: workingConfig,
      };

      await source.save(
        '/api/dialogs/save',
        payload,
        workingConfig,
        selectedDialogKey === 'NEW_DIALOG'
      );

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
      executeSave({ varName: selectedDialogKey || '' });
    }
  };

  const handleDelete = async () => {
    if (!selectedDialogKey || selectedDialogKey === 'NEW_DIALOG') return;
    if (!confirm(`Delete "${selectedDialogKey}"?`)) return;

    try {
      await source.save(
        '/api/dialogs/delete',
        { dialogKey: selectedDialogKey },
        null
      );

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
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pb-20">
        {/* Core Line Info */}
        <div className="rounded border border-slate-700 bg-slate-800 p-4">
          <h4 className="mb-2 text-xs font-bold text-cyan-400 uppercase">
            Text Content
          </h4>
          <textarea
            value={line.text}
            onChange={(e) =>
              updateLine(selectedLineIndex, { ...line, text: e.target.value })
            }
            className="h-24 w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
          <div className="mt-2">
            <label className="mr-2 text-xs text-slate-400">
              Line ID (Optional):
            </label>
            <input
              value={line.id || ''}
              onChange={(e) =>
                updateLine(selectedLineIndex, { ...line, id: e.target.value })
              }
              className="w-40 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
              placeholder="unique-id"
            />
          </div>
          <div className="mt-2">
            <label className="mr-2 text-xs text-slate-400">Layout:</label>
            <select
              value={line.layout || 'default'}
              onChange={(e) =>
                updateLine(selectedLineIndex, {
                  ...line,
                  layout: e.target.value as DialogLayout,
                })
              }
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
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
        <div className="rounded border border-slate-700 bg-slate-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-400 uppercase">
              Portraits
            </h4>
            <button
              onClick={() =>
                updateLine(selectedLineIndex, {
                  ...line,
                  portraits: [...line.portraits, { ...DEFAULT_PORTRAIT }],
                })
              }
              className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600"
            >
              + Add Portrait
            </button>
          </div>

          <div className="space-y-3">
            {line.portraits.map((portrait, pIdx) => (
              <div
                key={pIdx}
                className="relative flex flex-col gap-2 rounded border border-slate-700/50 bg-slate-900 p-2"
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
                  className="absolute top-1 right-1 px-1 text-xs text-red-500 hover:text-red-400"
                >
                  ✕
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                    >
                      {SPEAKER_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Orientation
                    </label>
                    <div className="mt-1 flex h-7 items-center">
                      <input
                        type="checkbox"
                        checked={!!portrait.flipped}
                        onChange={(e) => {
                          const newPortraits = [...line.portraits];
                          newPortraits[pIdx] = {
                            ...portrait,
                            flipped: e.target.checked,
                          };
                          updateLine(selectedLineIndex, {
                            ...line,
                            portraits: newPortraits,
                          });
                        }}
                        className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span
                        className="ml-2 cursor-pointer text-xs text-slate-400"
                        onClick={() => {
                          const newPortraits = [...line.portraits];
                          newPortraits[pIdx] = {
                            ...portrait,
                            flipped: !portrait.flipped,
                          };
                          updateLine(selectedLineIndex, {
                            ...line,
                            portraits: newPortraits,
                          });
                        }}
                      >
                        Flip Horizontally
                      </span>
                    </div>
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
        <div className="rounded border border-slate-700 bg-slate-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-400 uppercase">
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
              className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600"
            >
              + Add Button
            </button>
          </div>

          <div className="space-y-3">
            {line.buttons?.map((btn, bIdx) => (
              <div
                key={bIdx}
                className="relative flex flex-col gap-2 rounded border border-slate-700/50 bg-slate-900 p-2"
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
                  className="absolute top-1 right-1 px-1 text-xs text-red-500 hover:text-red-400"
                >
                  ✕
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                    >
                      {BUTTON_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
                      placeholder="Optional ID"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
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
                      className="w-full rounded border border-slate-700 bg-slate-950 p-1 text-xs"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 font-sans text-white backdrop-blur">
      <EditorSourceStatus source={source} onClose={onClose} />
      <div className="flex h-full w-full overflow-hidden">
        {/* PANEL 1: Dialog List (Left) */}
        <div className="flex w-64 flex-col border-r border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-3">
            <h2 className="text-sm font-bold text-slate-300">Dialogs</h2>
            <div className="flex gap-1">
              <button
                onClick={handleCreateNew}
                className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600"
              >
                + New
              </button>
              <button
                onClick={onClose}
                className="px-2 text-slate-500 hover:text-white"
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
                className={`mb-1 w-full truncate rounded px-3 py-2 text-left font-mono text-xs transition-colors ${
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
        <div className="flex w-80 flex-col border-r border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 bg-slate-950 p-3">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-800 p-1 text-xs text-slate-300"
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

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {workingConfig ? (
              workingConfig.sequence.map((line, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLineIndex(idx)}
                  className={`group relative cursor-pointer rounded border p-2 ${
                    selectedLineIndex === idx
                      ? 'border-cyan-600/50 bg-slate-800'
                      : 'border-slate-800 bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="font-mono text-[10px] text-slate-500">
                      #{idx}
                    </span>
                    {line.id && (
                      <span className="rounded bg-purple-900/50 px-1 text-[10px] text-purple-200">
                        {line.id}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-300">
                    {line.text}
                  </p>

                  <div className="absolute top-1 right-1 hidden gap-1 group-hover:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLine(idx, -1);
                      }}
                      className="p-1 text-slate-600 hover:text-cyan-400"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLine(idx, 1);
                      }}
                      className="p-1 text-slate-600 hover:text-cyan-400"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLine(idx);
                      }}
                      className="p-1 text-slate-600 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="mt-10 text-center text-xs text-slate-600">
                Select a dialog
              </div>
            )}
          </div>

          {workingConfig && (
            <div className="border-t border-slate-800 p-2">
              <button
                onClick={addLine}
                className="flex w-full items-center justify-center gap-2 rounded border border-slate-700 bg-slate-800 py-2 text-xs text-slate-300 hover:bg-slate-700"
              >
                <span>+ Add Line</span>
              </button>
            </div>
          )}
        </div>

        {/* PANEL 3: Workspace (Right) */}
        <div className="flex min-w-0 flex-1 flex-col bg-black transition-all duration-300">
          {/* Visual Preview (Top) */}
          <div
            className={`${isEditorCollapsed ? 'flex-1' : 'h-1/2'} relative overflow-hidden border-b border-slate-800 bg-gray-900 transition-all duration-300`}
          >
            <div className="absolute top-2 left-2 z-20 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-slate-400 uppercase">
              Preview Mode
            </div>
            {workingConfig && (
              <div className="h-full w-full origin-center scale-90 transform">
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
              <div className="flex h-full w-full items-center justify-center text-slate-600">
                No Preview
              </div>
            )}
          </div>

          {/* Editor (Bottom) */}
          <div
            className={`${isEditorCollapsed ? 'h-10' : 'h-1/2'} flex min-h-0 flex-col bg-slate-900 transition-all duration-300`}
          >
            {/* Toolbar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
                  className="mr-2 text-slate-500 hover:text-white"
                  title={
                    isEditorCollapsed ? 'Expand Editor' : 'Minimize Editor'
                  }
                >
                  {isEditorCollapsed ? '▲' : '▼'}
                </button>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Line Editor
                </h3>
                {!isEditorCollapsed && (
                  <div className="flex rounded border border-slate-800 bg-slate-900 p-0.5">
                    <button
                      onClick={() => setShowJsonMode(false)}
                      className={`rounded px-3 py-1 text-[10px] ${!showJsonMode ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Visual
                    </button>
                    <button
                      onClick={() => setShowJsonMode(true)}
                      className={`rounded px-3 py-1 text-[10px] ${showJsonMode ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      JSON
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="mr-2 text-xs text-orange-400 italic">
                    Unsaved Changes
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !workingConfig}
                  className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Dialog'}
                </button>
                {selectedDialogKey && selectedDialogKey !== 'NEW_DIALOG' && (
                  <button
                    onClick={handleDelete}
                    className="rounded border border-red-900/50 bg-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Edit Content */}
            {!isEditorCollapsed && (
              <div className="min-h-0 flex-1">
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
          <div className="w-96 rounded border border-slate-600 bg-slate-800 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              Save New Dialog
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-400 uppercase">
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
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-400 uppercase">
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
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowNewDialogModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => executeSave()}
                className="rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500"
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
