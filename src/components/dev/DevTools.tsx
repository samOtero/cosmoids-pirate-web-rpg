'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';

const DialogEditor = lazy(() => import('./DialogEditor'));
const AnimationEditor = lazy(() => import('./AnimationEditor'));

type ToolType = 'DIALOG' | 'ANIMATION' | null;

export default function DevTools() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowMenu((prev) => !prev);
        setActiveTool(null); // Reset on toggle? Or just hide menu
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showMenu && !activeTool) return null;

  return (
    <>
      {showMenu && !activeTool && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          <div className="bg-black/90 text-white p-3 rounded border border-slate-700 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">
              Dev Tools (Ctrl+D)
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTool('DIALOG');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Dialog Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('ANIMATION');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Animation Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTool && (
        <Suspense
          fallback={
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded">
              Loading...
            </div>
          }
        >
          {activeTool === 'DIALOG' && (
            <DialogEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'ANIMATION' && (
            <AnimationEditor onClose={() => setActiveTool(null)} />
          )}
        </Suspense>
      )}
    </>
  );
}
