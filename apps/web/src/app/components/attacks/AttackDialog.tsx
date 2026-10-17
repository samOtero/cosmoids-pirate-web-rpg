'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Shared keyboard focus and scrolling for touch-friendly move dialogs. */
export function AttackDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl border-2 border-cyan-600 bg-slate-900 p-3 text-slate-100 shadow-xl outline-none sm:p-5"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
          if (event.key !== 'Tab') return;
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), select:not(:disabled), input:not(:disabled), summary, [tabindex="0"]'
            )
          ).filter((element) => element.getClientRects().length > 0);
          const first = focusable[0],
            last = focusable.at(-1);
          if (!first || !last) {
            event.preventDefault();
            return;
          }
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === panel.current)
          ) {
            event.preventDefault();
            last.focus();
          } else if (
            !event.shiftKey &&
            (document.activeElement === last ||
              document.activeElement === panel.current)
          ) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2
          id={titleId}
          className="mb-3 text-lg font-bold text-cyan-200 sm:text-xl"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
