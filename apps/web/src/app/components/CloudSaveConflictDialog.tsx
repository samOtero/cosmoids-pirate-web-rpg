'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from './ui/Button';

export default function CloudSaveConflictDialog() {
  const conflict = useGameStore((s) => s.cloudSaveConflict);
  const error = useGameStore((s) => s.cloudSaveError);
  const acknowledge = useGameStore((s) => s.acknowledgeSaveConflict);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = Boolean(conflict);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, [open]);
  if (!conflict) return null;
  const deleted = conflict.kind === 'deleted';
  return (
    <dialog
      ref={dialog}
      aria-labelledby="cloud-conflict-title"
      aria-describedby="cloud-conflict-description"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border-2 border-wood bg-ocean-dark p-5 text-sand shadow-2xl backdrop:bg-black/75"
    >
      <h2 id="cloud-conflict-title" className="text-xl font-bold">
        {deleted ? 'Cloud save deleted' : 'A newer cloud save is available'}
      </h2>
      <p
        id="cloud-conflict-description"
        className="mt-3 text-sm leading-relaxed text-sand/80"
      >
        {deleted
          ? 'This profile was deleted elsewhere. It cannot be saved again. Return to your save slots to continue.'
          : 'This profile was saved on another device or tab. Your unsaved changes in this tab will be discarded when the latest saved progress loads.'}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-amber-200">
          {error}
        </p>
      )}
      <Button
        className="mt-5 min-h-11 w-full px-3 text-sm"
        onClick={acknowledge}
      >
        {deleted ? 'Back to saves' : 'Load latest save'}
      </Button>
    </dialog>
  );
}
