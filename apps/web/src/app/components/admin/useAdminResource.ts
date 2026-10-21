'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminRequestError, getAdmin } from '@/lib/admin-client';

export type OnAdminDenied = (status: number) => void;
export function useAdminResource<T>(path: string, onDenied: OnAdminDenied) {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const [result, setResult] = useState<{
    path: string;
    attempt: number;
    data: T | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getAdmin<T>(path, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ path, attempt, data, error: null });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof AdminRequestError &&
          [401, 403].includes(error.status)
        )
          onDenied(error.status);
        setResult({
          path,
          attempt,
          data: null,
          error:
            error instanceof Error
              ? error.message
              : 'Could not load this information.',
        });
      }
    );
    return () => controller.abort();
  }, [path, attempt, onDenied]);
  const current =
    result?.path === path && result.attempt === attempt ? result : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: !current,
    retry,
  };
}
