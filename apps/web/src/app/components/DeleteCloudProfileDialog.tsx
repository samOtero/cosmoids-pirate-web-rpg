'use client';

import { useEffect, useRef } from 'react';
import { Button } from './ui/Button';

export default function DeleteCloudProfileDialog({
  name,
  slot,
  onConfirm,
  onClose,
}: {
  name: string;
  slot: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-cloud-title"
      aria-describedby="delete-cloud-description"
      onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-xl border-2 border-wood bg-ocean-dark p-5 text-sand shadow-2xl backdrop:bg-black/75"
    >
      <h3 id="delete-cloud-title" className="text-xl font-bold">
        Delete cloud save?
      </h3>
      <p className="mt-3 font-bold break-words text-cyan-300">
        {name} · Slot {slot + 1}
      </p>
      <p
        id="delete-cloud-description"
        className="mt-2 text-sm leading-relaxed text-sand/80"
      >
        This permanently deletes this profile and every Cosmoid in its team and
        storage. Any unsaved progress in this tab will also be lost. This cannot
        be undone.
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          ref={cancel}
          type="button"
          onClick={onClose}
          className="min-h-11 rounded border border-sand/40 px-4 font-bold focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          Cancel
        </button>
        <Button
          variant="danger"
          className="min-h-11 px-4 text-sm"
          onClick={onConfirm}
        >
          Delete cloud save
        </Button>
      </div>
    </dialog>
  );
}
