import { describe, expect, it } from 'vitest';
import {
  findEditorExport,
  parseEditorSource,
  patchEditorExport,
  removeEditorExport,
  updateEditorBarrel,
  updateEditorEnum,
} from '@/utils/editorSourcePatch';

describe('editor source patches', () => {
  it('adds and removes an encounter gender without replacing other authored fields', () => {
    const source = `export const LEVEL = {
      waveEnemyDefinitions: [{ id: 'boss', creatureId: 'example', level: LEVEL_CAP, /* keep */ }],
      paths: SHARED_PATHS,
    };
    export const OTHER = { enabled: true };`;
    const before = {
      waveEnemyDefinitions: [{ id: 'boss', creatureId: 'example', level: 10 }],
      paths: [],
    };
    const after = {
      ...before,
      waveEnemyDefinitions: [
        { ...before.waveEnemyDefinitions[0], gender: 'male' },
      ],
    };
    const added = patchEditorExport(source, 'LEVEL', before, after);
    expect(added).toContain('"gender": "male"');
    expect(added).toContain('level: LEVEL_CAP');
    expect(added).toContain('/* keep */');
    expect(added).toContain('paths: SHARED_PATHS');
    expect(added).toContain('export const OTHER = { enabled: true };');
    const removed = patchEditorExport(added, 'LEVEL', after, before);
    expect(removed).not.toContain('gender');
    expect(removed).toContain('level: LEVEL_CAP');
    parseEditorSource(removed);
  });
  it('changes one nested value while preserving references, comments, helpers and neighboring exports', () => {
    const source = `import { SHARED } from './shared';
const HP = 100;
export const SAMPLE = {
  // keep this authored note
  point: { x: 1, y: 2, future: 'metadata' },
  hp: HP,
  intermission: SHARED,
};
/** documentation for the next export */
export const SAMPLE_EXTRA = { enabled: true };
function helper() { return 'export const SAMPLE;'; }
`;
    const before = {
      point: { x: 1, y: 2, future: 'metadata' },
      hp: 100,
      intermission: { sequence: [1] },
    };
    const after = { ...before, point: { ...before.point, x: 5 } };
    const saved = patchEditorExport(source, 'SAMPLE', before, after);
    expect(saved).toContain('x: 5');
    expect(saved).toContain('hp: HP');
    expect(saved).toContain('intermission: SHARED');
    expect(saved).toContain('// keep this authored note');
    expect(saved.slice(saved.indexOf('/** documentation'))).toBe(
      source.slice(source.indexOf('/** documentation'))
    );
    parseEditorSource(saved);
  });

  it('preserves a spread and appends only an edited scalar override', () => {
    const saved = patchEditorExport(
      'export const SAMPLE = { ...BASE };',
      'SAMPLE',
      { hp: 4, paths: [[1, 2]] },
      { hp: 7, paths: [[1, 2]] }
    );
    expect(saved).toContain('...BASE');
    expect(saved).toContain('"hp": 7');
    expect(saved).not.toContain('paths');
  });

  it('refuses to flatten shared objects or inherited arrays', () => {
    expect(() =>
      patchEditorExport(
        'export const SAMPLE = { shared: BASE };',
        'SAMPLE',
        { shared: { x: 1 } },
        { shared: { x: 2 } }
      )
    ).toThrow('shared expression');
    expect(() =>
      patchEditorExport(
        'export const SAMPLE = { ...BASE };',
        'SAMPLE',
        { paths: [[1]] },
        { paths: [[2]] }
      )
    ).toThrow('shared configuration');
    expect(() =>
      patchEditorExport(
        'export const SAMPLE = { x: 1, ...BASE };',
        'SAMPLE',
        { x: 1 },
        { x: 2 }
      )
    ).toThrow('later spread');
  });

  it('refuses inherited deletions and changed shared shorthand properties', () => {
    expect(() =>
      patchEditorExport(
        'export const SAMPLE = { ...BASE };',
        'SAMPLE',
        { inherited: true },
        {}
      )
    ).toThrow('Cannot remove inherited');
    expect(() =>
      patchEditorExport(
        'export const SAMPLE = { shared };',
        'SAMPLE',
        { shared: { x: 1 } },
        { shared: { x: 2 } }
      )
    ).toThrow('shared expression');
  });

  it('handles semicolons, export-like strings, dollar identifiers and exact export names', () => {
    const source = `export const SAMPLE_EXTRA = { text: 'untouched;' }; export const $SAMPLE = { text: 'Wait; export const is just dialogue.' }; // footer`;
    const saved = patchEditorExport(
      source,
      '$SAMPLE',
      { text: 'Wait; export const is just dialogue.' },
      { text: '$&; a new line' }
    );
    expect(saved).toContain(`SAMPLE_EXTRA = { text: 'untouched;' }`);
    expect(saved).toContain('"$&; a new line"');
    expect(saved).toContain('// footer');
    parseEditorSource(saved);
    expect(
      findEditorExport(parseEditorSource(source), 'SAMPLE')
    ).toBeUndefined();
  });

  it('preserves expressions and comments when inserting, removing and reordering array entries', () => {
    const source = `export const SAMPLE = { rows: [ /* first */ { id: 'a', hp: HP }, /* second */ { id: 'b', hp: 2 }, /* tail */ ] };`;
    const before = {
      rows: [
        { id: 'a', hp: 100 },
        { id: 'b', hp: 2 },
      ],
    };
    const saved = patchEditorExport(source, 'SAMPLE', before, {
      rows: [
        { id: 'b', hp: 3 },
        { id: 'c', hp: 4 },
        { id: 'a', hp: 100 },
      ],
    });
    expect(saved).toContain('hp: HP');
    expect(saved).toContain('/* first */');
    expect(saved).toContain('/* second */');
    expect(saved).toContain('/* tail */');
    expect(saved.indexOf("id: 'b'")).toBeLessThan(saved.indexOf("id: 'a'"));
    parseEditorSource(saved);
  });

  it('patches one visual entry without reserializing other entries', () => {
    const source = `export const VISUALS = { 'move-one': { scale: 1, future: true }, other: SHARED }; const tail = 1;`;
    const saved = patchEditorExport(
      source,
      'VISUALS',
      { scale: 1, future: true },
      { scale: 2, future: true },
      undefined,
      'move-one'
    );
    expect(saved).toContain('other: SHARED');
    expect(saved).toContain('future: true');
    expect(saved).toContain('const tail = 1');
    const added = patchEditorExport(
      saved,
      'VISUALS',
      null,
      { scale: 3 },
      undefined,
      'new-move'
    );
    expect(added).toContain('"new-move"');
    expect(added).toContain('other: SHARED');
    parseEditorSource(added);
  });

  it('keeps no-op saves byte-for-byte unchanged and preserves type wrappers', () => {
    const source = 'export const SAMPLE = ({ x: 1 } as const) satisfies Data;';
    expect(patchEditorExport(source, 'SAMPLE', { x: 1 }, { x: 1 })).toBe(
      source
    );
    const changed = patchEditorExport(source, 'SAMPLE', { x: 1 }, { x: 2 });
    expect(changed).toContain('as const) satisfies Data');
    parseEditorSource(changed);
  });

  it('deletes only the selected dialogue declaration', () => {
    const source = `export const SAMPLE = { text: 'semicolon; export const' };\n/** next */\nexport const SAMPLE_EXTRA = { enabled: true };\nconst helper = 1;`;
    const saved = removeEditorExport(source, 'SAMPLE');
    expect(
      findEditorExport(parseEditorSource(saved), 'SAMPLE')
    ).toBeUndefined();
    expect(saved).toContain('/** next */');
    expect(saved).toContain('SAMPLE_EXTRA');
    expect(saved).toContain('const helper = 1');
  });

  it('updates barrels and enums regardless of quote style without matching similar names', () => {
    const barrel = `export * from "./dialogs/sample";\nexport * from './dialogs/sampleExtra';`;
    expect(updateEditorBarrel(barrel, './dialogs/sample')).toBe(barrel);
    expect(updateEditorBarrel(barrel, './dialogs/sample', true)).toContain(
      'sampleExtra'
    );
    const source = `export enum Context { SAMPLE = "SAMPLE", SAMPLE_EXTRA = 'SAMPLE_EXTRA', }\nexport const tail = 1;`;
    expect(updateEditorEnum(source, 'Context', 'SAMPLE')).toBe(source);
    const removed = updateEditorEnum(source, 'Context', 'SAMPLE', true);
    expect(removed).not.toContain('SAMPLE =');
    expect(removed).toContain('SAMPLE_EXTRA');
    expect(removed).toContain('export const tail');
  });

  it('rejects malformed source rather than reconstructing it', () => {
    expect(() =>
      patchEditorExport('export const SAMPLE = {', 'SAMPLE', {}, {})
    ).toThrow('syntax error');
  });
});
