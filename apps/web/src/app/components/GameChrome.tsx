'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** The administration page scrolls normally and supports portrait screens. */
export default function GameChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === '/admin' || path?.startsWith('/admin/') ? null : children;
}
