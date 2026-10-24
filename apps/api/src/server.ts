import Fastify from 'fastify';
import { readAuthConfig } from './auth-config.js';
import { createAuth } from './auth.js';
import { registerAuthRoutes } from './auth-routes.js';
import { pool } from './database.js';
import { registerProfileRoutes } from './profile-routes.js';
import { loadGameContent } from './game-content.js';
import { registerAdminRoutes } from './admin-routes.js';
import { readAdminAccounts } from './admin-config.js';
import { createPasswordResetEmail } from './password-reset-email.js';
import { loggedRequestURL } from './request-logging.js';

const server = Fastify({
  logger: {
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: loggedRequestURL(request.url),
          remoteAddress: request.ip,
        };
      },
    },
    redact: [
      'req.headers.cookie',
      'req.headers.authorization',
      "res.headers['set-cookie']",
    ],
  },
  // Nginx connects over loopback; other forwarded-header senders are untrusted.
  trustProxy: 'loopback',
});

const authConfig = readAuthConfig();
const resetEmail = createPasswordResetEmail(process.env, fetch, () => {
  server.log.error('Password reset email delivery failed');
});
const auth = createAuth(pool, authConfig, resetEmail?.send);
const content = await loadGameContent();
await registerAuthRoutes(server, auth, authConfig);
await registerProfileRoutes(server, auth, authConfig, pool, content);
await registerAdminRoutes(
  server,
  auth,
  authConfig,
  pool,
  readAdminAccounts(),
  content.maxProfiles
);

pool.on('error', (error) => {
  server.log.error({ err: error }, 'Idle database connection failed');
});

server.get('/health', async () => {
  return { ok: true };
});

server.get('/health/db', async (_request, reply) => {
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (error) {
    server.log.error({ err: error }, 'Database health check failed');
    return reply.code(503).send({ ok: false });
  }
});

server.addHook('onClose', async () => {
  await resetEmail?.drain();
  await pool.end();
});

async function shutdown() {
  try {
    await server.close();
  } catch (error) {
    server.log.error({ err: error }, 'API shutdown failed');
    process.exitCode = 1;
  }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await server.listen({ host: '127.0.0.1', port: 3001 });
