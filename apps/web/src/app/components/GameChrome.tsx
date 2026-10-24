'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Standalone pages support portrait screens without game overlays. */
export default function GameChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === '/admin' ||
    path?.startsWith('/admin/') ||
    path === '/reset-password' ||
    path === '/reset-password/'
    ? null
    : children;
}
