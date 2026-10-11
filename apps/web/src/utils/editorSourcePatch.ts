import ts from 'typescript';
import { EditorSourceError } from './editorSourceError';
export { EditorSourceError } from './editorSourceError';

export function parseEditorSource(source: string): ts.SourceFile {
  const file = ts.createSourceFile(
    'editor.ts',
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const diagnostics = (
    file as ts.SourceFile & { parseDiagnostics: ts.Diagnostic[] }
  ).parseDiagnostics;
  if (diagnostics.length) {
    throw new EditorSourceError(
      'The source contains a syntax error. Fix it before saving.'
    );
  }
  return file;
}

// Editor reads parse the same modules repeatedly (every directory module during
// export resolution, shared enums for every snapshot). A parse is reused only
// while the file text is identical, so manual edits and editor writes are
// always observed. Callers must treat the returned tree as read-only.
const parsedEditorFiles = new Map<
  string,
  { source: string; file: ts.SourceFile }
>();

export function parseEditorFile(
  filePath: string,
  source: string
): ts.SourceFile {
  const cached = parsedEditorFiles.get(filePath);
  if (cached?.source === source) return cached.file;
  const file = parseEditorSource(source);
  parsedEditorFiles.set(filePath, { source, file });
  return file;
}

export function findEditorExport(file: ts.SourceFile, name: string) {
  for (const statement of file.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    const declaration = statement.declarationList.declarations.find(
      (d) => ts.isIdentifier(d.name) && d.name.text === name
    );
    if (declaration) return { statement, declaration };
  }
  return undefined;
}

function propertyName(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  )
    return name.text;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function sameEditorValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => sameEditorValue(v, b[i]));
  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every(
        (key) => Object.hasOwn(b, key) && sameEditorValue(a[key], b[key])
      )
    );
  }
  return false;
}

export type EditorValueRenderer = (value: unknown, key?: string) => string;

/** JSON is used only for newly authored values, never to reconstruct a source file. */
export const renderEditorValue: EditorValueRenderer = (value) => {
  const text = JSON.stringify(value);
  if (text === undefined)
    throw new EditorSourceError('Cannot save an undefined value.');
  return text;
};

function unwrap(expression: ts.Expression): ts.Expression {
  if (
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  )
    return unwrap(expression.expression);
  return expression;
}

/** Patch only changed nodes. Unchanged expressions, spreads and comments stay authored source. */
function patchExpression(
  expression: ts.Expression,
  before: unknown,
  after: unknown,
  file: ts.SourceFile,
  render: EditorValueRenderer,
  location: string,
  key?: string
): string {
  if (sameEditorValue(before, after)) return expression.getText(file);
  const node = unwrap(expression);
  if (node !== expression) {
    const text = expression.getText(file);
    const start = node.getStart(file) - expression.getStart(file);
    return (
      text.slice(0, start) +
      patchExpression(node, before, after, file, render, location, key) +
      text.slice(node.end - expression.getStart(file))
    );
  }
  if (
    ts.isObjectLiteralExpression(node) &&
    isRecord(before) &&
    isRecord(after)
  ) {
    for (const name of Object.keys(before)) {
      if (
        !Object.hasOwn(after, name) &&
        !node.properties.some(
          (p) => !ts.isSpreadAssignment(p) && propertyName(p.name) === name
        )
      ) {
        throw new EditorSourceError(
          `Cannot remove inherited ${location}.${name}. Edit its source file.`
        );
      }
    }
    const authoredKeys = new Set<string>();
    const properties: string[] = [];
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        properties.push(property.getFullText(file));
        continue;
      }
      const name = propertyName(property.name);
      if (name === undefined || authoredKeys.has(name)) {
        throw new EditorSourceError(
          `Cannot safely edit computed or duplicate properties at ${location}. Edit this expression in the source file.`
        );
      }
      authoredKeys.add(name);
      if (!Object.hasOwn(after, name)) {
        if (node.properties.some(ts.isSpreadAssignment))
          throw new EditorSourceError(
            `Cannot remove ${location}.${name} while a spread may supply it. Edit the source file.`
          );
        continue;
      }
      if (sameEditorValue(before[name], after[name])) {
        properties.push(property.getFullText(file));
      } else if (ts.isPropertyAssignment(property)) {
        if (
          node.properties
            .slice(node.properties.indexOf(property) + 1)
            .some(ts.isSpreadAssignment)
        ) {
          throw new EditorSourceError(
            `A later spread may override ${location}.${name}. Edit this expression in the source file.`
          );
        }
        const text = property.getFullText(file);
        const start =
          property.initializer.getStart(file) - property.getFullStart();
        properties.push(
          text.slice(0, start) +
            patchExpression(
              property.initializer,
              before[name],
              after[name],
              file,
              render,
              `${location}.${name}`,
              name
            ) +
            text.slice(property.initializer.end - property.getFullStart())
        );
      } else if (ts.isShorthandPropertyAssignment(property)) {
        if (before[name] !== null && typeof before[name] === 'object') {
          throw new EditorSourceError(
            `${location}.${name} is a shared expression. Edit its source instead of flattening it.`
          );
        }
        const trivia = file.text.slice(
          property.getFullStart(),
          property.getStart(file)
        );
        properties.push(`${trivia}${name}: ${render(after[name], name)}`);
      } else {
        throw new EditorSourceError(
          `Cannot safely edit ${location}.${name}. Edit this expression in the source file.`
        );
      }
    }
    for (const name of Object.keys(after)) {
      if (authoredKeys.has(name) || sameEditorValue(before[name], after[name]))
        continue;
      if (
        Object.hasOwn(before, name) &&
        typeof before[name] === 'object' &&
        before[name] !== null
      ) {
        throw new EditorSourceError(
          `${location}.${name} comes from shared configuration. Edit its source instead of copying it into this file.`
        );
      }
      properties.push(
        `\n${JSON.stringify(name)}: ${render(after[name], name)}`
      );
    }
    // Includes comments after the last property, before the closing brace.
    const tailStart = node.properties.length
      ? node.properties[node.properties.length - 1].end
      : node.getStart(file) + 1;
    const tail = file.text.slice(tailStart, node.end - 1).replace(/^\s*,/, '');
    return `{${properties.join(',')}${properties.length ? ',' : ''}${tail}}`;
  }
  if (
    ts.isArrayLiteralExpression(node) &&
    Array.isArray(before) &&
    Array.isArray(after)
  ) {
    if (
      node.elements.length !== before.length ||
      node.elements.some(
        (e) => ts.isSpreadElement(e) || ts.isOmittedExpression(e)
      )
    ) {
      throw new EditorSourceError(
        `Cannot safely edit the shared array at ${location}. Edit its source file.`
      );
    }
    const used = new Set<number>();
    const elements = after.map((value, index) => {
      let previous = before.findIndex(
        (candidate, i) => !used.has(i) && sameEditorValue(candidate, value)
      );
      if (previous < 0 && isRecord(value) && typeof value.id === 'string') {
        previous = before.findIndex(
          (candidate, i) =>
            !used.has(i) && isRecord(candidate) && candidate.id === value.id
        );
      }
      if (previous < 0 && before.length === after.length && !used.has(index))
        previous = index;
      if (previous < 0) return `\n${render(value)}`;
      used.add(previous);
      const element = node.elements[previous];
      const trivia = file.text.slice(
        element.getFullStart(),
        element.getStart(file)
      );
      return (
        trivia +
        patchExpression(
          element,
          before[previous],
          value,
          file,
          render,
          `${location}[${index}]`
        )
      );
    });
    const tailStart = node.elements.length
      ? node.elements[node.elements.length - 1].end
      : node.getStart(file) + 1;
    const tail = file.text.slice(tailStart, node.end - 1).replace(/^\s*,/, '');
    return `[${elements.join(',')}${elements.length ? ',' : ''}${tail}]`;
  }
  if (
    (isRecord(before) && isRecord(after)) ||
    (Array.isArray(before) && Array.isArray(after))
  ) {
    throw new EditorSourceError(
      `${location} is a shared expression (${node.getText(file)}). Edit its source instead of flattening it.`
    );
  }
  return render(after, key);
}

export function patchEditorExport(
  source: string,
  name: string,
  before: unknown,
  after: unknown,
  render: EditorValueRenderer = renderEditorValue,
  entryKey?: string
): string {
  const file = parseEditorSource(source);
  const found = findEditorExport(file, name);
  if (!found?.declaration.initializer)
    throw new EditorSourceError(
      `Export ${name} was not found. Reload the editor.`,
      409
    );
  const expression = found.declaration.initializer;
  let replacement: string;
  if (entryKey !== undefined) {
    const node = unwrap(expression);
    if (!ts.isObjectLiteralExpression(node))
      throw new EditorSourceError(`${name} must be an object literal.`);
    const property = node.properties.find(
      (p) => !ts.isSpreadAssignment(p) && propertyName(p.name) === entryKey
    );
    if (property && !ts.isPropertyAssignment(property))
      throw new EditorSourceError(`Cannot safely edit ${name}.${entryKey}.`);
    if (property && ts.isPropertyAssignment(property)) {
      const text = expression.getText(file);
      const start =
        property.initializer.getStart(file) - expression.getStart(file);
      replacement =
        text.slice(0, start) +
        patchExpression(
          property.initializer,
          before,
          after,
          file,
          render,
          `${name}.${entryKey}`
        ) +
        text.slice(property.initializer.end - expression.getStart(file));
    } else {
      if (before !== null)
        throw new EditorSourceError(
          'The selected entry was removed. Reload the editor.',
          409
        );
      const beforeObject: Record<string, unknown> = {};
      // Avoid touching siblings when adding one new map entry.
      node.properties.forEach((p) => {
        if (!ts.isSpreadAssignment(p)) {
          const key = propertyName(p.name);
          if (key !== undefined) beforeObject[key] = null;
        }
      });
      replacement = patchExpression(
        expression,
        beforeObject,
        { ...beforeObject, [entryKey]: after },
        file,
        render,
        name
      );
    }
  } else
    replacement = patchExpression(
      expression,
      before,
      after,
      file,
      render,
      name
    );
  return (
    source.slice(0, expression.getStart(file)) +
    replacement +
    source.slice(expression.end)
  );
}

export function removeEditorExport(source: string, name: string): string {
  const file = parseEditorSource(source);
  const found = findEditorExport(file, name);
  if (!found) throw new EditorSourceError(`Export ${name} was not found.`, 404);
  if (found.statement.declarationList.declarations.length !== 1)
    throw new EditorSourceError(
      'Cannot delete one declaration from a combined statement. Edit the source file.'
    );
  return (
    source.slice(0, found.statement.getStart(file)) +
    source.slice(found.statement.end)
  );
}

export function updateEditorBarrel(
  source: string,
  moduleName: string,
  remove = false
): string {
  const file = parseEditorSource(source);
  const statement = file.statements.find(
    (s) =>
      ts.isExportDeclaration(s) &&
      s.moduleSpecifier &&
      ts.isStringLiteral(s.moduleSpecifier) &&
      s.moduleSpecifier.text === moduleName
  );
  if (!remove)
    return statement
      ? source
      : `${source}\nexport * from ${JSON.stringify(moduleName)};\n`;
  return statement
    ? source.slice(0, statement.getStart(file)) + source.slice(statement.end)
    : source;
}

export function updateEditorEnum(
  source: string,
  enumName: string,
  name: string,
  remove = false
): string {
  const file = parseEditorSource(source);
  const statement = file.statements.find(
    (s) => ts.isEnumDeclaration(s) && s.name.text === enumName
  );
  if (!statement || !ts.isEnumDeclaration(statement))
    throw new EditorSourceError(`Enum ${enumName} was not found.`);
  const member = statement.members.find((m) => propertyName(m.name) === name);
  if (!remove && member) return source;
  const members = statement.members
    .filter((m) => !remove || m !== member)
    .map((m) => m.getFullText(file));
  if (!remove) members.push(`\n${name} = ${JSON.stringify(name)}`);
  const open = source.indexOf('{', statement.getStart(file));
  return (
    source.slice(0, open + 1) +
    members.join(',') +
    (members.length ? ',\n' : '\n') +
    source.slice(statement.end - 1)
  );
}
