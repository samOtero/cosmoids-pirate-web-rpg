import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import { EditorSourceError, parseEditorSource } from './editorSourcePatch';

export function editorRevision(source: string | null): string {
  return createHash('sha256')
    .update(source === null ? 'missing' : `source:${source}`)
    .digest('hex');
}

export async function readEditorFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

// All editor writes share a queue, including updates to barrels and enums.
let writes: Promise<unknown> = Promise.resolve();
export function withEditorWrite<T>(work: () => Promise<T>): Promise<T> {
  const next = writes.then(work, work);
  writes = next.catch(() => undefined);
  return next;
}

export interface EditorFileChange {
  filePath: string;
  before: string | null;
  after: string;
}

/** Validate and stage the complete batch before replacing any source file. */
export async function commitEditorFiles(
  changes: EditorFileChange[]
): Promise<void> {
  const staged: Array<EditorFileChange & { temporary: string }> = [];
  const committed: typeof staged = [];
  try {
    for (const change of changes) {
      if (change.before === change.after) continue;
      parseEditorSource(change.after);
      const options = await prettier.resolveConfig(change.filePath);
      const formatted = await prettier.format(change.after, {
        ...options,
        filepath: change.filePath,
      });
      parseEditorSource(formatted);
      staged.push({
        ...change,
        after: formatted,
        temporary: `${change.filePath}.${randomUUID()}.editor-tmp`,
      });
    }
    for (const change of staged) {
      if ((await readEditorFile(change.filePath)) !== change.before)
        throw new EditorSourceError(
          'The source changed while saving. Your draft is retained; reload before saving again.',
          409
        );
    }
    for (const change of staged)
      await fs.writeFile(change.temporary, change.after, {
        encoding: 'utf8',
        flag: 'wx',
      });
    for (const change of staged) {
      if ((await readEditorFile(change.filePath)) !== change.before)
        throw new EditorSourceError(
          'The source changed while saving. Reload before saving again.',
          409
        );
      await fs.rename(change.temporary, change.filePath);
      committed.push(change);
    }
  } catch (error) {
    // Best-effort rollback only files still containing our version.
    for (const change of committed.reverse()) {
      if ((await readEditorFile(change.filePath)) !== change.after) continue;
      if (change.before === null) await fs.unlink(change.filePath);
      else {
        await fs.writeFile(change.temporary, change.before, 'utf8');
        await fs.rename(change.temporary, change.filePath);
      }
    }
    throw error;
  } finally {
    await Promise.all(
      staged.map((change) =>
        fs.unlink(change.temporary).catch((error) => {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        })
      )
    );
  }
}

export function editorAppPath(...parts: string[]): string {
  return path.join(process.cwd(), 'src', ...parts);
}
