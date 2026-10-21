import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import pg from 'pg';
import { getMigrations } from 'better-auth/db/migration';
import { createAuthOptions } from '../../src/auth.ts';
import { readAuthConfig } from '../../src/auth-config.ts';
import { applyGameMigrations } from '../../src/game-migrations.ts';

const local = process.env.GAME_TEST_USE_LOCAL_PG === '1';
const enabled = local || Boolean(process.env.GAME_TEST_DATABASE_URL);
export const testAuthConfig = readAuthConfig({
  NODE_ENV: 'production',
  BETTER_AUTH_URL: 'https://api.example.com',
  BETTER_AUTH_SECRET: randomBytes(32).toString('base64'),
  AUTH_TRUSTED_ORIGINS: 'https://game.example.com',
});
export function databaseTest(name, fn) {
  test(
    name,
    {
      skip: enabled
        ? false
        : 'Set GAME_TEST_DATABASE_URL or run pnpm test:game-db:local.',
    },
    fn
  );
}
export async function fixture(t, { auth = true, migrate = true } = {}) {
  if (
    local &&
    (process.env.NODE_ENV === 'production' ||
      !['127.0.0.1', 'localhost', '::1'].includes(process.env.PGHOST))
  )
    throw new Error(
      'Local game tests require a loopback development database.'
    );
  const schema = 'game_test_' + randomUUID().replaceAll('-', '');
  const pool = new pg.Pool({
    ...(local ? {} : { connectionString: process.env.GAME_TEST_DATABASE_URL }),
    options: `-c search_path=${schema}`,
    max: 5,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
  let client;
  t.after(async () => {
    try {
      if (client) {
        await client.query('ROLLBACK');
        client.release();
      }
      // The identifier is generated here, never supplied by a caller.
      await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await pool.end();
    }
  });
  await pool.query(`CREATE SCHEMA "${schema}"`);
  client = await pool.connect();
  if (auth)
    await (
      await getMigrations(createAuthOptions(pool, testAuthConfig))
    ).runMigrations();
  if (migrate) await applyGameMigrations(client);
  return { pool, client };
}
