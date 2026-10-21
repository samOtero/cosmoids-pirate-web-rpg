// This entry point opts into the local PG* settings without changing .env.
// The regular test suite requires an explicit GAME_TEST_DATABASE_URL instead.
import { spawnSync } from 'node:child_process';
if (
  process.env.NODE_ENV === 'production' ||
  !['127.0.0.1', 'localhost', '::1'].includes(process.env.PGHOST)
) {
  throw new Error(
    'Local game database tests require a loopback development database.'
  );
}
const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    '--test',
    // Better Auth introspects all schemas; another file must not drop one mid-query.
    '--test-concurrency=1',
    'tests/game-schema.test.mjs',
    'tests/profiles-api.test.mjs',
    'tests/admin-api.test.mjs',
  ],
  {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, GAME_TEST_USE_LOCAL_PG: '1' },
    stdio: 'inherit',
  }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
