import { fileURLToPath } from 'node:url';
import { runner, type RunnerOption } from 'node-pg-migrate';
import type { PoolClient } from 'pg';

// Auth migrations remain owned by Better Auth. Only game migrations live here.
async function options(client: PoolClient): Promise<RunnerOption> {
  const { rows } = await client.query<{ schema: string | null }>(
    'SELECT current_schema() AS schema'
  );
  if (!rows[0].schema)
    throw new Error('Game migrations require a current schema.');
  return {
    dbClient: client,
    dir: fileURLToPath(new URL('./migrations/', import.meta.url)),
    migrationsTable: 'game_schema_migrations',
    migrationsSchema: rows[0].schema,
    direction: 'up',
    checkOrder: true,
    singleTransaction: true,
    advisoryLockMode: 'wait',
    logger: { info() {}, warn() {}, error() {} },
  };
}

/** Preview leaves no persistent changes, including on a fresh database. */
export async function planGameMigrations(
  client: PoolClient,
  printSql: (sql: string) => void = () => {}
) {
  const config = await options(client);
  // v9 dry-run skips migration SQL but still ensures its history table exists.
  // Roll back that setup too; singleTransaction:false prevents an inner COMMIT.
  await client.query('BEGIN');
  try {
    const pending = await runner({
      ...config,
      dryRun: true,
      singleTransaction: false,
      noLock: true,
      verbose: true,
      logger: { info() {}, warn() {}, error() {}, debug: printSql },
    });
    return pending.map((migration) => migration.name);
  } finally {
    await client.query('ROLLBACK');
  }
}

/** The library owns migration discovery, history, ordering, locks and execution. */
export async function applyGameMigrations(client: PoolClient) {
  const applied = await runner(await options(client));
  return applied.map((migration) => migration.name);
}
