import { getMigrations } from 'better-auth/db/migration';
import { readAuthConfig } from './auth-config.js';
import { createAuthOptions } from './auth.js';
import { pool } from './database.js';

// Schema changes are an explicit deployment step, never a server startup side effect.
try {
  const plan = await getMigrations(createAuthOptions(pool, readAuthConfig()));
  const sql = await plan.compileMigrations();
  console.log(sql || 'Auth schema is already up to date.');
  if (process.argv.includes('--apply')) {
    await plan.runMigrations();
    console.log('Auth schema migration completed.');
  } else {
    console.log('Preview only. Run auth:migrate to apply this plan.');
  }
} finally {
  await pool.end();
}
