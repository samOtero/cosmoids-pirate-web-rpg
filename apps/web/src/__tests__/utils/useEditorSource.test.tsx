import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEditorSource } from '@/components/dev/useEditorSource';

const response = (data: unknown, ok = true) => ({ ok, json: async () => data });
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('editor source sessions', () => {
  it('loads a fresh baseline and advances it after each successful save', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({ revision: 'first', config: { value: 1, future: true } })
      )
      .mockResolvedValueOnce(response({ revision: 'second', success: true }))
      .mockResolvedValueOnce(response({ revision: 'third', success: true }));
    vi.stubGlobal('fetch', fetch);
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      useEditorSource('visuals', 'demo', onLoad)
    );
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(onLoad).toHaveBeenCalledWith({ value: 1, future: true });
    await act(() =>
      result.current.save('/save', { id: 'demo' }, { value: 2, future: true })
    );
    expect(JSON.parse(fetch.mock.calls[1][1].body).source).toEqual({
      revision: 'first',
      base: { value: 1, future: true },
    });
    await act(() =>
      result.current.save('/save', {}, { value: 3, future: true })
    );
    expect(JSON.parse(fetch.mock.calls[2][1].body).source).toEqual({
      revision: 'second',
      base: { value: 2, future: true },
    });
  });

  it('retains the open draft and reports conflicts without automatically reloading', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({ revision: 'first', config: { value: 1 } })
      )
      .mockResolvedValueOnce(
        response({ error: 'Source changed; reload.' }, false)
      );
    vi.stubGlobal('fetch', fetch);
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      useEditorSource('visuals', 'demo', onLoad)
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await expect(
        result.current.save('/save', {}, { value: 2 })
      ).rejects.toThrow('Source changed');
    });
    expect(result.current.error).toContain('Source changed');
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.saving).toBe(false);
  });

  it('ignores a late load response after switching targets', async () => {
    let finishFirst: (value: unknown) => void = () => undefined;
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve;
          })
      )
      .mockResolvedValueOnce(
        response({ revision: 'second', config: { value: 2 } })
      );
    vi.stubGlobal('fetch', fetch);
    const onLoad = vi.fn();
    const { result, rerender } = renderHook(
      ({ id }) => useEditorSource('visuals', id, onLoad),
      { initialProps: { id: 'first' } }
    );
    rerender({ id: 'second' });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      finishFirst(response({ revision: 'first', config: { value: 1 } }));
    });
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith({ value: 2 });
  });

  it('blocks saves before loading and simultaneous saves', async () => {
    let finish: (value: unknown) => void = () => undefined;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({ revision: 'first', config: { value: 1 } })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() =>
      useEditorSource('visuals', 'demo', vi.fn())
    );
    await act(async () => {
      await expect(
        result.current.save('/save', {}, { value: 2 })
      ).rejects.toThrow('Wait for the source');
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let pending: Promise<unknown>;
    act(() => {
      pending = result.current.save('/save', {}, { value: 2 });
    });
    await expect(
      result.current.save('/save', {}, { value: 3 })
    ).rejects.toThrow('already in progress');
    await act(async () => {
      finish(response({ revision: 'second' }));
      await pending;
    });
    expect(result.current.saving).toBe(false);
  });
});
