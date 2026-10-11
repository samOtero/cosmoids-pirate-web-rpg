import path from 'node:path';
import ts from 'typescript';
import {
  EditorSourceError,
  findEditorExport,
  parseEditorFile,
} from './editorSourcePatch';
import {
  editorAppPath,
  editorRevision,
  readEditorFile,
} from './editorSourceFiles';

/** Read data syntax without executing authored code. Calls retain their compiled
 * runtime value and remain opaque to the patcher; edits through them are rejected. */
export async function readEditorSnapshot(
  filePath: string,
  exportName: string,
  fallback: unknown,
  entryKey?: string
) {
  const sources = new Map<string, string>();
  const files = new Map<string, ts.SourceFile>();
  const resolving = new Set<string>();
  const root = editorAppPath();

  const load = async (target: string) => {
    if (files.has(target)) return files.get(target)!;
    if (!path.resolve(target).startsWith(path.resolve(root) + path.sep))
      throw new EditorSourceError('Editor data imports must stay inside src.');
    const source = await readEditorFile(target);
    if (source === null)
      throw new EditorSourceError(
        `Cannot read imported source ${path.basename(target)}.`
      );
    sources.set(target, source);
    const file = parseEditorFile(target, source);
    files.set(target, file);
    return file;
  };

  const symbol = async (
    name: string,
    target: string,
    backup: unknown
  ): Promise<unknown> => {
    const token = `${target}:${name}`;
    if (resolving.has(token))
      throw new EditorSourceError(
        'A circular data reference cannot be loaded safely.'
      );
    resolving.add(token);
    try {
      const file = await load(target);
      for (const statement of file.statements) {
        if (ts.isVariableStatement(statement)) {
          const declaration = statement.declarationList.declarations.find(
            (d) => ts.isIdentifier(d.name) && d.name.text === name
          );
          if (declaration?.initializer)
            return await expression(declaration.initializer, target, backup);
        }
        if (ts.isEnumDeclaration(statement) && statement.name.text === name) {
          const values: Record<string, unknown> = {};
          for (const member of statement.members) {
            if (!member.initializer)
              throw new EditorSourceError(
                'Implicit enum values are not supported by the editor reader.'
              );
            values[member.name.getText(file).replace(/^['"]|['"]$/g, '')] =
              await expression(member.initializer, target, undefined);
          }
          return values;
        }
        if (
          ts.isImportDeclaration(statement) &&
          ts.isStringLiteral(statement.moduleSpecifier)
        ) {
          const bindings = statement.importClause?.namedBindings;
          if (!bindings || !ts.isNamedImports(bindings)) continue;
          const imported = bindings.elements.find((e) => e.name.text === name);
          if (!imported) continue;
          const specifier = statement.moduleSpecifier.text;
          const importedPath = specifier.startsWith('@/')
            ? editorAppPath(specifier.slice(2))
            : specifier.startsWith('.')
              ? path.resolve(path.dirname(target), specifier)
              : null;
          if (importedPath)
            return await symbol(
              imported.propertyName?.text ?? name,
              `${importedPath}.ts`,
              backup
            );
        }
      }
      if (backup !== undefined) return backup;
      throw new EditorSourceError(
        `Cannot read data reference ${name}. Edit it in the source file.`
      );
    } finally {
      resolving.delete(token);
    }
  };

  const expression = async (
    node: ts.Expression,
    target: string,
    backup: unknown
  ): Promise<unknown> => {
    if (
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return expression(node.expression, target, backup);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isIdentifier(node))
      return node.text === 'undefined'
        ? undefined
        : symbol(node.text, target, backup);
    if (
      ts.isPrefixUnaryExpression(node) &&
      (node.operator === ts.SyntaxKind.MinusToken ||
        node.operator === ts.SyntaxKind.PlusToken)
    ) {
      const value = await expression(node.operand, target, undefined);
      if (typeof value !== 'number')
        throw new EditorSourceError('A numeric expression could not be read.');
      return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
    }
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const key = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : await expression(node.argumentExpression, target, undefined);
      const object = await expression(node.expression, target, undefined);
      if (
        object === null ||
        typeof object !== 'object' ||
        (typeof key !== 'string' && typeof key !== 'number')
      )
        throw new EditorSourceError(
          'A data property reference could not be read.'
        );
      return (object as Record<string, unknown>)[key];
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result: Record<string, unknown> = {};
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const value = await expression(property.expression, target, backup);
          if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new EditorSourceError('An object spread could not be read.');
          Object.assign(result, value);
        } else if (
          ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property)
        ) {
          const name = property.name;
          if (
            !ts.isIdentifier(name) &&
            !ts.isStringLiteral(name) &&
            !ts.isNumericLiteral(name)
          )
            throw new EditorSourceError(
              'Computed data keys must be edited in source.'
            );
          const previous =
            backup && typeof backup === 'object'
              ? (backup as Record<string, unknown>)[name.text]
              : undefined;
          Object.defineProperty(result, name.text, {
            value: await expression(
              ts.isPropertyAssignment(property)
                ? property.initializer
                : property.name,
              target,
              previous
            ),
            enumerable: true,
            configurable: true,
            writable: true,
          });
        } else throw new EditorSourceError('Methods must be edited in source.');
      }
      return result;
    }
    if (ts.isArrayLiteralExpression(node)) {
      const result: unknown[] = [];
      for (const element of node.elements) {
        if (ts.isSpreadElement(element)) {
          const value = await expression(element.expression, target, undefined);
          if (!Array.isArray(value))
            throw new EditorSourceError('An array spread could not be read.');
          result.push(...value);
        } else if (ts.isOmittedExpression(element))
          throw new EditorSourceError(
            'Sparse arrays must be edited in source.'
          );
        else
          result.push(
            await expression(
              element,
              target,
              Array.isArray(backup) ? backup[result.length] : undefined
            )
          );
      }
      return result;
    }
    if (backup !== undefined) return backup;
    throw new EditorSourceError(
      'This expression cannot be loaded safely. Edit it in the source file.'
    );
  };

  const source = await readEditorFile(filePath);
  if (source === null)
    return { source, revision: editorRevision(null), config: null };
  const file = await load(filePath);
  const found = findEditorExport(file, exportName);
  if (!found?.declaration.initializer)
    return { source, revision: editorRevision(source), config: null };
  let config: unknown;
  if (entryKey !== undefined) {
    const initializer = found.declaration.initializer;
    if (!ts.isObjectLiteralExpression(initializer))
      throw new EditorSourceError(
        'The visual registry must be an object literal.'
      );
    const property = initializer.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
        p.name.text === entryKey
    );
    config =
      property && ts.isPropertyAssignment(property)
        ? await expression(property.initializer, filePath, fallback)
        : null;
  } else
    config = await expression(
      found.declaration.initializer,
      filePath,
      fallback
    );
  const version = [...sources]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, text]) => `${name}\n${editorRevision(text)}`)
    .join('\n');
  return { source, revision: editorRevision(version), config };
}
