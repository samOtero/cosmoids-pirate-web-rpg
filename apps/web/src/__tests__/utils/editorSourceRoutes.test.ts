import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorSourceError } from '@/utils/editorSourceError';
import { POST as load } from '@/app/api/dev/editor-source/route';
import { POST as level } from '@/app/api/dev/td-levels/save/route';
import { POST as visuals } from '@/app/api/dev/save-creature-position/route';
import { POST as animations } from '@/app/api/animations/save/route';
import { POST as dialog } from '@/app/api/dialogs/save/route';
import { POST as removeDialog } from '@/app/api/dialogs/delete/route';

const service = vi.hoisted(() => ({
  loadEditorSource: vi.fn(),
  saveEditorSource: vi.fn(),
  deleteEditorDialog: vi.fn(),
}));
vi.mock('@/utils/editorSourceService', () => service);

const baseline = { revision: 'loaded-version', base: { future: true } };
const routes = [
  {
    name: 'source read',
    post: load,
    body: { kind: 'level', id: 'demo' },
    operation: 'loadEditorSource',
    args: ['level', 'demo'],
  },
  {
    name: 'level save',
    post: level,
    body: { levelContext: 'demo', config: {}, source: baseline },
    operation: 'saveEditorSource',
    args: ['level', 'demo', {}, baseline, undefined],
  },
  {
    name: 'visual save',
    post: visuals,
    body: { creatureId: 'demo', tdConfig: {}, source: baseline },
    operation: 'saveEditorSource',
    args: ['visuals', 'demo', {}, baseline],
  },
  {
    name: 'animation save',
    post: animations,
    body: { animations: {}, source: baseline },
    operation: 'saveEditorSource',
    args: ['animations', 'ANIMATIONS', {}, baseline],
  },
  {
    name: 'dialogue save',
    post: dialog,
    body: { dialogName: 'DEMO', config: {}, source: baseline },
    operation: 'saveEditorSource',
    args: ['dialog', 'DEMO', {}, baseline, undefined],
  },
  {
    name: 'dialogue delete',
    post: removeDialog,
    body: { dialogKey: 'DEMO', source: baseline },
    operation: 'deleteEditorDialog',
    args: ['DEMO', baseline],
  },
] as const;

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/editor', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() => {
  vi.clearAllMocks();
  service.loadEditorSource.mockResolvedValue({
    revision: 'source-version',
    config: {},
  });
  service.saveEditorSource.mockResolvedValue({
    success: true,
    revision: 'saved-version',
  });
  service.deleteEditorDialog.mockResolvedValue({ success: true });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('editor route protocol', () => {
  it.each(routes)(
    'disables $name in production before accessing editor services',
    async (route) => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = await route.post(request(route.body));
      expect(result.status).toBe(403);
      Object.values(service).forEach((operation) =>
        expect(operation).not.toHaveBeenCalled()
      );
    }
  );

  it.each(routes)(
    'forwards the source baseline for $name in development',
    async (route) => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await route.post(request(route.body));
      expect(result.status).toBe(200);
      expect(service[route.operation]).toHaveBeenCalledWith(...route.args);
    }
  );

  it('returns actionable conflict messages to the editor', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.saveEditorSource.mockRejectedValueOnce(
      new EditorSourceError('Source changed; reload.', 409)
    );
    const result = await level(
      request({ levelContext: 'demo', config: {}, source: baseline })
    );
    expect(result.status).toBe(409);
    expect(await result.json()).toEqual({ error: 'Source changed; reload.' });
  });
});
