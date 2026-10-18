'use client';

import { useEffect, useId, useRef } from 'react';
import type { TowerTargetingMode } from '@/engine/tower-defense/types';

const priorities = [
  { value: 'first', label: 'First', description: 'Furthest along the path' },
  { value: 'last', label: 'Last', description: 'Least far along the path' },
  {
    value: 'closest',
    label: 'Closest',
    description: 'Nearest to this Cosmoid',
  },
  { value: 'strongest', label: 'Most HP', description: 'Highest remaining HP' },
  { value: 'weakest', label: 'Least HP', description: 'Lowest remaining HP' },
  {
    value: 'lowest-hp-percent',
    label: 'Lowest HP %',
    description: 'Lowest health percentage',
  },
  {
    value: 'highest-hp-percent',
    label: 'Highest HP %',
    description: 'Highest health percentage',
  },
] satisfies { value: TowerTargetingMode; label: string; description: string }[];

/** One tower-wide preference; mobile shares the tray, desktop opens above it. */
export function TargetPriorityMenu({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: TowerTargetingMode;
  onChange?: (mode: TowerTargetingMode) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const priority =
    priorities.find((item) => item.value === value) ?? priorities[0];

  useEffect(() => {
    if (open) selected.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <div
      className={`relative min-h-0 shrink-0 ${open ? 'flex-1 lg:flex-none' : ''}`}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={'Target priority: ' + priority.label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={id + '-summary'}
        onClick={() => onOpenChange(!open)}
        className={`flex min-h-11 w-full items-center gap-3 rounded-md border border-cyan-800 bg-slate-950 px-3 py-1.5 text-left hover:border-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${open ? 'hidden lg:flex' : ''}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-cyan-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-100">
            Target priority:{' '}
            <span className="text-cyan-200">{priority.label}</span>
          </span>
          <span id={id + '-summary'} className="block text-xs text-slate-400">
            {priority.description} · within range
          </span>
        </span>
        <span aria-hidden="true" className="text-cyan-200">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <section
          id={id}
          aria-label="Choose target priority"
          className="flex h-full min-h-0 flex-col lg:absolute lg:right-0 lg:bottom-[calc(100%+8px)] lg:h-auto lg:max-h-[min(520px,80dvh)] lg:w-96 lg:rounded-lg lg:border lg:border-cyan-600 lg:bg-slate-900 lg:p-3 lg:shadow-2xl"
        >
          <p className="mb-0.5 shrink-0 text-[11px] leading-3 font-semibold text-cyan-200 lg:hidden">
            Target priority · Enemies within range
          </p>
          <div className="mb-2 hidden shrink-0 items-center justify-between gap-2 lg:flex">
            <div>
              <h3 className="text-sm font-bold text-cyan-200">
                Target priority
              </h3>
              <p className="text-xs text-slate-400">
                Who this Cosmoid attacks first, within range.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-11 shrink-0 rounded border border-slate-600 px-3 text-xs font-semibold hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              Cancel
            </button>
          </div>
          <div
            role="group"
            aria-label="Target priority options"
            className="grid min-h-0 grid-cols-2 gap-1 overflow-y-auto overscroll-contain sm:grid-cols-3 lg:grid-cols-1 lg:gap-1.5"
          >
            {priorities.map((item) => (
              <button
                ref={item.value === value ? selected : undefined}
                key={item.value}
                type="button"
                aria-label={item.label}
                aria-describedby={id + '-' + item.value}
                aria-pressed={item.value === value}
                onClick={() => {
                  if (item.value !== value) onChange?.(item.value);
                  onOpenChange(false);
                }}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-200 lg:min-h-12 ${item.value === value ? 'border-cyan-300 bg-cyan-950' : 'border-slate-700 bg-slate-800 hover:border-cyan-500'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-100">
                    {item.label}
                  </span>
                  <span
                    id={id + '-' + item.value}
                    className="block text-[11px] leading-tight text-slate-300"
                  >
                    {item.description}
                  </span>
                </span>
                {item.value === value && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-sm text-cyan-200"
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
