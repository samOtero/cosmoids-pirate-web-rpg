'use client';

import { useEffect, useRef, useState } from 'react';

type EditorKind = 'level' | 'dialog' | 'visuals' | 'animations';
interface Snapshot<T> {
  key: string;
  revision: string;
  base: T | null;
}

/** Drafts load with a source version; HMR never silently replaces an open draft. */
export function useEditorSource<T>(
  kind: EditorKind,
  id: string | null,
  onLoad: (config: T) => void
) {
  const key = id === null ? null : `${kind}:${id}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const ready = key === null || snapshot?.key === key;

  useEffect(() => {
    setSnapshot(null);
    setError('');
    if (id === null || key === null) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('/api/dev/editor-source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, id }),
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Could not load editor source.');
        if (controller.signal.aborted) return;
        if (data.config !== null) onLoadRef.current(data.config);
        setSnapshot({
          key,
          revision: data.revision,
          base: structuredClone(data.config),
        });
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Could not load editor source.'
          );
      }
    })();
    return () => controller.abort();
  }, [kind, id, key, reloadCount]);

  const save = async (
    url: string,
    payload: Record<string, unknown>,
    config: T | null,
    creating = false
  ) => {
    if (savingRef.current) throw new Error('A save is already in progress.');
    if (!creating && (!ready || !snapshot))
      throw new Error('Wait for the source to load before saving.');
    savingRef.current = true;
    setSaving(true);
    setError('');
    const savedKey = key;
    const savedConfig = structuredClone(config);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          source: creating
            ? { revision: null, base: null }
            : { revision: snapshot!.revision, base: snapshot!.base },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not save editor source.');
      if (savedKey === currentKey.current && savedKey !== null && data.revision)
        setSnapshot({
          key: savedKey,
          revision: data.revision,
          base: savedConfig,
        });
      return data;
    } catch (failure) {
      const message =
        failure instanceof Error
          ? failure.message
          : 'Could not save editor source.';
      if (savedKey === currentKey.current) setError(message);
      throw failure;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return {
    ready,
    saving,
    error,
    save,
    reload: () => {
      if (!confirm('Reload the source and discard this editor draft?')) return;
      setSnapshot(null);
      setReloadCount((count) => count + 1);
    },
  };
}
