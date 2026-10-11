import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { TD_LEVELS } from '@/constants/tdLevels';
import { getTDLevelSaveTarget } from '@/constants/tdLevelSaveTargets';
import * as dialogs from '@/constants/dialogs';
import { ANIMATIONS } from '@/constants/animations';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import {
  BackgroundImageKey,
  SpeakerImageKey,
  TDLevelContext,
} from '@/types/baseGame';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { validateTDLevelDraft } from './tdLevelDraft';
import type { TDLevelData } from '@/engine/tower-defense/types';
import {
  EditorSourceError,
  findEditorExport,
  parseEditorFile,
  parseEditorSource,
  patchEditorExport,
  removeEditorExport,
  updateEditorBarrel,
  updateEditorEnum,
  type EditorValueRenderer,
  sameEditorValue,
} from './editorSourcePatch';
import {
  commitEditorFiles,
  editorAppPath,
  readEditorFile,
  withEditorWrite,
  type EditorFileChange,
} from './editorSourceFiles';
import { readEditorSnapshot } from './editorSourceRead';

export type EditorKind = 'level' | 'dialog' | 'visuals' | 'animations';
export interface EditorSourceBaseline {
  revision: string | null;
  base: unknown;
}

interface Target {
  filePath: string;
  exportName: string;
  entryKey?: string;
  config: unknown;
  directory?: string;
  typeName: string;
  typeModule: string;
}

function identifier(name: string): void {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
    throw new EditorSourceError('Choose a valid TypeScript identifier.', 400);
}

async function resolveTarget(
  kind: EditorKind,
  id: string,
  fileName?: string
): Promise<Target> {
  if (!id || typeof id !== 'string')
    throw new EditorSourceError('An editor target is required.', 400);
  if (kind === 'animations')
    return {
      filePath: editorAppPath('constants', 'animations.ts'),
      exportName: 'ANIMATIONS',
      config: ANIMATIONS,
      typeName: 'AnimationMap',
      typeModule: '@/types/animation',
    };
  if (kind === 'visuals')
    return {
      filePath: editorAppPath('constants', 'tdConfigs.ts'),
      exportName: 'CREATURE_TD_CONFIGS',
      entryKey: id,
      config: CREATURE_TD_CONFIGS[id] ?? null,
      typeName: 'Record<string, UnitVisuals>',
      typeModule: '@/types/baseGame',
    };
  if (kind !== 'level' && kind !== 'dialog')
    throw new EditorSourceError('Unknown editor kind.', 400);
  const registered = kind === 'level' ? getTDLevelSaveTarget(id) : undefined;
  const exportName = registered?.exportName ?? id;
  identifier(exportName);
  const directory = kind === 'level' ? 'tdLevels' : 'dialogs';
  const dirPath = editorAppPath('constants', directory);
  // Resolve existing exports by syntax, never by a prefix or a string in a comment.
  let resolvedFile = registered?.fileName;
  if (!resolvedFile) {
    const modules = await Promise.all(
      (await fs.readdir(dirPath))
        .filter((name) => name.endsWith('.ts'))
        .map(async (name) => {
          const filePath = path.join(dirPath, name);
          return {
            name,
            filePath,
            source: await fs.readFile(filePath, 'utf8'),
          };
        })
    );
    for (const { name, filePath, source } of modules) {
      if (findEditorExport(parseEditorFile(filePath, source), exportName)) {
        if (resolvedFile)
          throw new EditorSourceError(
            `Multiple files export ${exportName}. Fix the duplicate before saving.`
          );
        resolvedFile = name.slice(0, -3);
      }
    }
  }
  resolvedFile ??= fileName || exportName;
  if (!/^[A-Za-z0-9_-]+$/.test(resolvedFile))
    throw new EditorSourceError(
      'Choose a filename containing only letters, numbers, underscores or hyphens.',
      400
    );
  return {
    filePath: path.join(dirPath, `${resolvedFile}.ts`),
    exportName,
    directory,
    config:
      kind === 'level'
        ? (TD_LEVELS[id as TDLevelContext]?.levelData ?? null)
        : ((dialogs as Record<string, unknown>)[id] ?? null),
    typeName: kind === 'level' ? 'TDLevelData' : 'DialogConfig',
    typeModule:
      kind === 'level' ? '@/engine/tower-defense/types' : '@/types/baseGame',
  };
}

export async function loadEditorSource(kind: EditorKind, id: string) {
  const target = await resolveTarget(kind, id);
  const snapshot = await readEditorSnapshot(
    target.filePath,
    target.exportName,
    target.config,
    target.entryKey
  );
  if (snapshot.config === null && target.config !== null) {
    throw new EditorSourceError(
      'This entry was removed from source. Reload the page before editing it.',
      409
    );
  }
  return { revision: snapshot.revision, config: snapshot.config };
}

function requireBaseline(
  baseline: EditorSourceBaseline | undefined,
  revision: string,
  exists: boolean
): void {
  if (!baseline || !Object.hasOwn(baseline, 'base'))
    throw new EditorSourceError(
      'Reload the editor to load a source version before saving.',
      428
    );
  if (baseline.revision === null) {
    if (baseline.base !== null || exists)
      throw new EditorSourceError(
        'This name already exists. Choose another name or load it in the editor.',
        409
      );
  } else if (baseline.revision !== revision) {
    throw new EditorSourceError(
      'The source changed since you loaded it. Your draft is retained; reload before saving again.',
      409
    );
  }
  if (exists && baseline.base === null)
    throw new EditorSourceError(
      'This entry already exists. Reload the editor.',
      409
    );
}

function dialogRenderer(): EditorValueRenderer {
  const enumExpression = (value: unknown, key?: string) => {
    const values =
      key === 'backgroundImageKey'
        ? BackgroundImageKey
        : key === 'key'
          ? SpeakerImageKey
          : null;
    if (!values) return null;
    const name = Object.keys(values).find(
      (name) => values[name as keyof typeof values] === value
    );
    return name
      ? `${key === 'key' ? 'SpeakerImageKey' : 'BackgroundImageKey'}.${name}`
      : null;
  };
  const render: EditorValueRenderer = (value, key) => {
    const expression = enumExpression(value, key);
    if (expression) return expression;
    if (Array.isArray(value))
      return `[${value.map((item) => render(item)).join(',')}]`;
    if (value && typeof value === 'object')
      return `{${Object.entries(value)
        .map(([name, item]) => `${JSON.stringify(name)}: ${render(item, name)}`)
        .join(',')}}`;
    const text = JSON.stringify(value);
    if (text === undefined)
      throw new EditorSourceError('Cannot save an undefined value.');
    return text;
  };
  return render;
}

function ensureEditorImports(
  source: string,
  moduleName: string,
  required: string[]
): string {
  const file = parseEditorSource(source);
  const declaration = file.statements.find(
    (s) =>
      ts.isImportDeclaration(s) &&
      ts.isStringLiteral(s.moduleSpecifier) &&
      s.moduleSpecifier.text === moduleName &&
      s.importClause?.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings)
  );
  if (
    !declaration ||
    !ts.isImportDeclaration(declaration) ||
    !declaration.importClause?.namedBindings ||
    !ts.isNamedImports(declaration.importClause.namedBindings)
  ) {
    return `import { ${required.join(', ')} } from '${moduleName}';\n${source}`;
  }
  const bindings = declaration.importClause.namedBindings;
  const missing = required.filter(
    (name) => !bindings.elements.some((e) => e.name.text === name)
  );
  const needsValues = bindings.elements.some(
    (e) => required.includes(e.name.text) && e.isTypeOnly
  );
  if (!missing.length && !declaration.importClause.isTypeOnly && !needsValues)
    return source;
  const names = [
    ...bindings.elements.map((e) => {
      if (e.isTypeOnly && required.includes(e.name.text))
        return e.propertyName
          ? `${e.propertyName.text} as ${e.name.text}`
          : e.name.text;
      return e.getFullText(file);
    }),
    ...missing,
  ];
  return (
    source.slice(
      0,
      declaration.importClause.isTypeOnly
        ? declaration.importClause.getStart(file)
        : bindings.getStart(file)
    ) +
    `{ ${names.join(', ')} }` +
    source.slice(bindings.end)
  );
}

export async function saveEditorSource(
  kind: EditorKind,
  id: string,
  config: unknown,
  baseline: EditorSourceBaseline,
  fileName?: string
) {
  return withEditorWrite(async () => {
    if (!config || typeof config !== 'object' || Array.isArray(config))
      throw new EditorSourceError('Configuration must be an object.', 400);
    const target = await resolveTarget(kind, id, fileName);
    const current = await readEditorSnapshot(
      target.filePath,
      target.exportName,
      target.config,
      target.entryKey
    );
    const source = current.source;
    const found =
      source === null
        ? undefined
        : findEditorExport(parseEditorSource(source), target.exportName);
    const exists =
      target.entryKey === undefined ? !!found : current.config !== null;
    requireBaseline(baseline, current.revision, exists);
    if (
      exists &&
      !sameEditorValue(
        baseline.base,
        JSON.parse(JSON.stringify(current.config))
      )
    ) {
      throw new EditorSourceError(
        'The loaded data no longer matches its source. Your draft is retained; reload before saving again.',
        409
      );
    }
    if (kind === 'level') {
      let errors: string[];
      try {
        errors = validateTDLevelDraft(
          config as TDLevelData,
          new Set(Object.keys(TD_CREATURE_DEFS)),
          new Set(Object.keys(ENEMY_ABILITY_DEFS))
        );
      } catch {
        throw new EditorSourceError(
          'The level configuration is incomplete.',
          400
        );
      }
      if (errors.length) throw new EditorSourceError(errors.join('\n'), 400);
    }
    const render = kind === 'dialog' ? dialogRenderer() : undefined;
    let after: string;
    if (found && source !== null)
      after = patchEditorExport(
        source,
        target.exportName,
        baseline.base,
        config,
        render,
        target.entryKey
      );
    else {
      if (target.entryKey)
        throw new EditorSourceError(
          'The visual registry is missing. Restore it before saving.'
        );
      const value = render ? render(config) : JSON.stringify(config);
      after = `${source ?? `import { ${target.typeName} } from '${target.typeModule}';\n`}\nexport const ${target.exportName}: ${target.typeName} = ${value};\n`;
    }
    if (kind === 'dialog' && after !== source)
      after = ensureEditorImports(after, '@/types/baseGame', [
        'BackgroundImageKey',
        'SpeakerImageKey',
        'DialogConfig',
      ]);
    if (kind === 'level' && !found)
      after = ensureEditorImports(after, target.typeModule, ['TDLevelData']);
    const changes: EditorFileChange[] = [
      { filePath: target.filePath, before: source, after },
    ];
    if (!found && target.directory) {
      const indexPath = editorAppPath('constants', `${target.directory}.ts`);
      const index = await readEditorFile(indexPath);
      changes.push({
        filePath: indexPath,
        before: index,
        after: updateEditorBarrel(
          index ?? '',
          `./${target.directory}/${path.basename(target.filePath, '.ts')}`
        ),
      });
      if (kind === 'dialog') {
        const enumPath = editorAppPath('types', 'baseGame.ts');
        const enumSource = await fs.readFile(enumPath, 'utf8');
        changes.push({
          filePath: enumPath,
          before: enumSource,
          after: updateEditorEnum(
            enumSource,
            'DialogContext',
            target.exportName
          ),
        });
      }
    }
    await commitEditorFiles(changes);
    const saved = await readEditorSnapshot(
      target.filePath,
      target.exportName,
      config,
      target.entryKey
    );
    return { success: true, revision: saved.revision, path: target.filePath };
  });
}

export async function deleteEditorDialog(
  id: string,
  baseline: EditorSourceBaseline
) {
  return withEditorWrite(async () => {
    const target = await resolveTarget('dialog', id);
    const current = await readEditorSnapshot(
      target.filePath,
      target.exportName,
      target.config
    );
    const source = current.source;
    requireBaseline(
      baseline,
      current.revision,
      !!source && !!findEditorExport(parseEditorSource(source), id)
    );
    if (source === null)
      throw new EditorSourceError('The dialogue no longer exists.', 404);
    const after = removeEditorExport(source, id);
    const enumPath = editorAppPath('types', 'baseGame.ts');
    const enumSource = await fs.readFile(enumPath, 'utf8');
    // Keep the module and its barrel: siblings, imports and helper code remain valid.
    await commitEditorFiles([
      { filePath: target.filePath, before: source, after },
      {
        filePath: enumPath,
        before: enumSource,
        after: updateEditorEnum(enumSource, 'DialogContext', id, true),
      },
    ]);
    return { success: true };
  });
}
