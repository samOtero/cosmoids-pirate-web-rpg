'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

const panelStyle =
  'relative rounded-lg border-4 border-wood bg-ocean-dark p-4 shadow-2xl';

function PanelCorners() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-wood-light" />
      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-wood-light" />
      <span className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-wood-light" />
      <span className="absolute right-2 bottom-2 h-2 w-2 rounded-full bg-wood-light" />
    </span>
  );
}

/** A native button whose entire decorated panel is the interactive target. */
export function PanelButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`${panelStyle} ${className}`}>
      <PanelCorners />
      {children}
    </button>
  );
}

export default function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${panelStyle} ${className}`}>
      <PanelCorners />
      {children}
    </div>
  );
}
