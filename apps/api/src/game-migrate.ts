import { pool } from './database.js';
import { applyGameMigrations, planGameMigrations } from './game-migrations.js';

// Explicit CLI only; the API server never imports or runs this entry point.
try {
  const client = await pool.connect();
  try {
    if (process.argv.includes('--apply')) {
      const applied = await applyGameMigrations(client);
      console.log(
        applied.length
          ? `Applied game migrations: ${applied.join(', ')}`
          : 'Game schema is already up to date.'
      );
    } else {
      const pending = await planGameMigrations(client, console.log);
      console.log(
        pending.length
          ? 'Preview only. Run the game migration with --apply to change the database.'
          : 'Game schema is already up to date.'
      );
    }
  } finally {
    client.release();
  }
} catch (error) {
  // Do not print driver connection objects, credentials, or environment values.
  console.error(
    error instanceof Error ? error.message : 'Game migration failed.'
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
