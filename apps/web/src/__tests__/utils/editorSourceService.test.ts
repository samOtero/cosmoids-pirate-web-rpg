import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundImageKey, SpeakerImageKey } from '@/types/baseGame';

const fixture = vi.hoisted(() => ({ root: '' }));
vi.mock('@/utils/editorSourceFiles', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/utils/editorSourceFiles')>();
  return {
    ...actual,
    editorAppPath: (...parts: string[]) =>
      path.join(fixture.root, 'src', ...parts),
  };
});

import {
  deleteEditorDialog,
  loadEditorSource,
  saveEditorSource,
} from '@/utils/editorSourceService';
import { commitEditorFiles } from '@/utils/editorSourceFiles';
import { readEditorSnapshot } from '@/utils/editorSourceRead';
import { findEditorExport, parseEditorSource } from '@/utils/editorSourcePatch';

const file = (...parts: string[]) => path.join(fixture.root, 'src', ...parts);
const write = (name: string, content: string) =>
  fs.writeFile(file('constants', name), content, 'utf8');

beforeEach(async () => {
  fixture.root = await fs.mkdtemp(path.join(os.tmpdir(), 'cosmoids-editor-'));
  await fs.mkdir(file('constants', 'dialogs'), { recursive: true });
  await fs.mkdir(file('constants', 'tdLevels'), { recursive: true });
  await fs.mkdir(file('types'), { recursive: true });
  await fs.writeFile(
    path.join(fixture.root, '.prettierrc'),
    JSON.stringify({ singleQuote: true, trailingComma: 'es5', endOfLine: 'lf' })
  );
  await fs.writeFile(
    file('types', 'baseGame.ts'),
    `export enum DialogContext { SAMPLE = 'SAMPLE', SAMPLE_EXTRA = 'SAMPLE_EXTRA' }\nexport enum BackgroundImageKey { DEFAULT = ${JSON.stringify(BackgroundImageKey.DEFAULT)} }\nexport enum SpeakerImageKey { EMPTY = ${JSON.stringify(SpeakerImageKey.EMPTY)} }`
  );
  await write('dialogs.ts', `export * from './dialogs/sample';`);
  await write('tdLevels.ts', '');
  await write(
    'dialogs/sample.ts',
    `export const SAMPLE = { sequence: [{ text: 'Wait; export const is dialogue.' }], future: { enabled: true } };\n/** neighbor */\nexport const SAMPLE_EXTRA = { sequence: [] };\nconst helper = 1;`
  );
  await write(
    'tdConfigs.ts',
    `export const CREATURE_TD_CONFIGS = { demo: { default: { scale: 1, future: true } }, other: { default: { scale: 4 } } };\nconst helper = 1;`
  );
  await write(
    'animations.ts',
    `export const ANIMATIONS = { demo: { id: 'demo', duration: 1, keyframes: [] } };\nconst helper = 1;`
  );
});

afterEach(async () => {
  if (!fixture.root) return;
  const resolved = path.resolve(fixture.root);
  if (
    !resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
    !path.basename(resolved).startsWith('cosmoids-editor-')
  )
    throw new Error('Unsafe fixture cleanup path.');
  await fs.rm(resolved, { recursive: true, force: true });
});

describe('shared editor save service', () => {
  it('preserves enum expressions and makes type-only imports usable as values', async () => {
    await write(
      'dialogs/sample.ts',
      `import type { DialogConfig, BackgroundImageKey } from '@/types/baseGame';\nexport const SAMPLE: DialogConfig = { backgroundImageKey: 'old', sequence: [{ text: 'hello', portraits: [] }] };`
    );
    const snapshot = await loadEditorSource('dialog', 'SAMPLE');
    const draft = {
      ...(snapshot.config as object),
      backgroundImageKey: BackgroundImageKey.DEFAULT,
    };
    const saved = await saveEditorSource('dialog', 'SAMPLE', draft, {
      revision: snapshot.revision,
      base: snapshot.config,
    });
    const content = await fs.readFile(saved.path, 'utf8');
    expect(content).toContain('backgroundImageKey: BackgroundImageKey.DEFAULT');
    expect(content).not.toContain('import type');
    expect((await loadEditorSource('dialog', 'SAMPLE')).config).toEqual(draft);
  });
  it.each(['dialog', 'visuals', 'animations'] as const)(
    'loads, patches, formats and saves %s repeatedly',
    async (kind) => {
      const id =
        kind === 'dialog'
          ? 'SAMPLE'
          : kind === 'visuals'
            ? 'demo'
            : 'ANIMATIONS';
      const snapshot = await loadEditorSource(kind, id);
      const draft = structuredClone(snapshot.config) as {
        sequence?: Array<{ text: string }>;
        default?: { scale: number };
        demo?: { duration: number };
      };
      if (kind === 'dialog') draft.sequence![0].text = 'New; export const text';
      if (kind === 'visuals') draft.default!.scale = 2;
      if (kind === 'animations') draft.demo!.duration = 2;
      const saved = await saveEditorSource(kind, id, draft, {
        revision: snapshot.revision,
        base: snapshot.config,
      });
      const loaded = await loadEditorSource(kind, id);
      expect(loaded.config).toEqual(draft);
      expect(loaded.revision).toBe(saved.revision);
      const content = await fs.readFile(saved.path, 'utf8');
      expect(content).toContain('const helper = 1');
      expect(content).not.toContain('"duration":');
      await saveEditorSource(kind, id, draft, {
        revision: saved.revision,
        base: draft,
      });
      expect(await fs.readFile(saved.path, 'utf8')).toBe(content);
    }
  );

  it('retains unknown fields and source references on a level edit', async () => {
    await write(
      'tdLevels/shared.ts',
      `export const SHARED = { sequence: [{ text: 'shared scene' }] };`
    );
    await write(
      'tdLevels/sample.ts',
      `import { SHARED } from './shared';\nconst HP = 10;\nexport const DEMO_LEVEL = { paths: [[{ x: 0, y: 0 }, { x: 100, y: 0 }]], placementSpots: [], waveEnemyDefinitions: [], waves: [], lives: 3, future: { hp: HP }, intermission: SHARED };\nconst tail = 1;`
    );
    const snapshot = await loadEditorSource('level', 'DEMO_LEVEL');
    const draft = { ...(snapshot.config as Record<string, unknown>), lives: 4 };
    const saved = await saveEditorSource('level', 'DEMO_LEVEL', draft, {
      revision: snapshot.revision,
      base: snapshot.config,
    });
    const content = await fs.readFile(saved.path, 'utf8');
    expect(content).toContain('hp: HP');
    expect(content).toContain('intermission: SHARED');
    expect(content).toContain('const tail = 1');
    expect((await loadEditorSource('level', 'DEMO_LEVEL')).config).toEqual(
      draft
    );
  });

  it('rejects stale, missing and mismatched baselines without writing', async () => {
    const snapshot = await loadEditorSource('visuals', 'demo');
    const target = file('constants', 'tdConfigs.ts');
    await fs.appendFile(target, '\n// manual change');
    const manual = await fs.readFile(target, 'utf8');
    await expect(
      saveEditorSource('visuals', 'demo', snapshot.config, {
        revision: snapshot.revision,
        base: snapshot.config,
      })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      saveEditorSource('visuals', 'demo', snapshot.config, undefined!)
    ).rejects.toMatchObject({ status: 428 });
    const fresh = await loadEditorSource('visuals', 'demo');
    await expect(
      saveEditorSource('visuals', 'demo', snapshot.config, {
        revision: fresh.revision,
        base: {},
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(await fs.readFile(target, 'utf8')).toBe(manual);
  });

  it('includes imported data in the revision and reads manual changes without stale module imports', async () => {
    await write(
      'dialogs/shared.ts',
      `export const SHARED = { sequence: [{ text: 'first' }] };`
    );
    await write(
      'dialogs/sample.ts',
      `import { SHARED } from './shared'; export const SAMPLE = { ...SHARED, extra: 1 };`
    );
    const snapshot = await loadEditorSource('dialog', 'SAMPLE');
    await write(
      'dialogs/shared.ts',
      `export const SHARED = { sequence: [{ text: 'second' }] };`
    );
    const next = await loadEditorSource('dialog', 'SAMPLE');
    expect(next.revision).not.toBe(snapshot.revision);
    expect(next.config).toMatchObject({ sequence: [{ text: 'second' }] });
    await expect(
      saveEditorSource(
        'dialog',
        'SAMPLE',
        { ...(snapshot.config as object), extra: 2 },
        { revision: snapshot.revision, base: snapshot.config }
      )
    ).rejects.toMatchObject({ status: 409 });
  });

  it('serializes concurrent saves and rejects the second stale draft', async () => {
    const snapshot = await loadEditorSource('visuals', 'demo');
    const baseline = { revision: snapshot.revision, base: snapshot.config };
    const results = await Promise.allSettled([
      saveEditorSource(
        'visuals',
        'demo',
        { default: { scale: 2, future: true } },
        baseline
      ),
      saveEditorSource(
        'visuals',
        'demo',
        { default: { scale: 3, future: true } },
        baseline
      ),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({
      status: 'rejected',
      reason: { status: 409 },
    });
    expect((await loadEditorSource('visuals', 'demo')).config).toMatchObject({
      default: { scale: 2 },
    });
  });

  it('creates new entries and refuses to overwrite an existing name', async () => {
    const created = await saveEditorSource(
      'dialog',
      'NEW_SCENE',
      { sequence: [{ text: 'new' }] },
      { revision: null, base: null },
      'newScene'
    );
    expect(created.success).toBe(true);
    expect(
      await fs.readFile(file('constants', 'dialogs.ts'), 'utf8')
    ).toContain('./dialogs/newScene');
    expect(await fs.readFile(file('types', 'baseGame.ts'), 'utf8')).toContain(
      "NEW_SCENE = 'NEW_SCENE'"
    );
    await expect(
      saveEditorSource(
        'dialog',
        'NEW_SCENE',
        { sequence: [] },
        { revision: null, base: null },
        'otherFile'
      )
    ).rejects.toMatchObject({ status: 409 });
    const fresh = await loadEditorSource('visuals', 'new-effect');
    const saved = await saveEditorSource(
      'visuals',
      'new-effect',
      { default: { scale: 2 } },
      { revision: fresh.revision, base: null }
    );
    expect(saved.success).toBe(true);
    expect((await loadEditorSource('visuals', 'new-effect')).config).toEqual({
      default: { scale: 2 },
    });
  });

  it('deletes one dialogue while retaining siblings, helper code and the barrel', async () => {
    const snapshot = await loadEditorSource('dialog', 'SAMPLE');
    await deleteEditorDialog('SAMPLE', {
      revision: snapshot.revision,
      base: snapshot.config,
    });
    const source = await fs.readFile(
      file('constants', 'dialogs', 'sample.ts'),
      'utf8'
    );
    const parsed = parseEditorSource(source);
    expect(findEditorExport(parsed, 'SAMPLE')).toBeUndefined();
    expect(findEditorExport(parsed, 'SAMPLE_EXTRA')).toBeDefined();
    expect(source).toContain('/** neighbor */');
    expect(source).toContain('const helper = 1');
    expect(
      await fs.readFile(file('constants', 'dialogs.ts'), 'utf8')
    ).toContain('./dialogs/sample');
    expect(
      await fs.readFile(file('types', 'baseGame.ts'), 'utf8')
    ).not.toContain('SAMPLE =');
  });

  it('preflights the entire write batch and leaves no temporary files on failure', async () => {
    const first = file('constants', 'animations.ts');
    const second = file('constants', 'tdConfigs.ts');
    const original = await fs.readFile(first, 'utf8');
    await expect(
      commitEditorFiles([
        {
          filePath: first,
          before: original,
          after: 'export const ANIMATIONS = { updated: true };',
        },
        {
          filePath: second,
          before: 'incorrect revision',
          after: 'export const VISUALS = {};',
        },
      ])
    ).rejects.toMatchObject({ status: 409 });
    expect(await fs.readFile(first, 'utf8')).toBe(original);
    expect(
      (await fs.readdir(path.dirname(first))).some((name) =>
        name.endsWith('.editor-tmp')
      )
    ).toBe(false);
  });

  it('never executes expressions from source files', async () => {
    await write(
      'animations.ts',
      'export const ANIMATIONS = (() => { throw new Error("executed"); })();'
    );
    await expect(
      readEditorSnapshot(
        file('constants', 'animations.ts'),
        'ANIMATIONS',
        undefined
      )
    ).rejects.toThrow('cannot be loaded safely');
    const loaded = await readEditorSnapshot(
      file('constants', 'animations.ts'),
      'ANIMATIONS',
      { compiled: true }
    );
    expect(loaded.config).toEqual({ compiled: true });
  });
});
