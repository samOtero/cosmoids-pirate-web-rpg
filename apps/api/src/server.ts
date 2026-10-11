import Fastify from "fastify";
import { readAuthConfig } from "./auth-config.js";
import { createAuth } from "./auth.js";
import { registerAuthRoutes } from "./auth-routes.js";
import { pool } from "./database.js";

const server = Fastify({
  logger: {
    redact: [
      "req.headers.cookie",
      "req.headers.authorization",
      "res.headers['set-cookie']",
    ],
  },
  // Nginx connects over loopback; other forwarded-header senders are untrusted.
  trustProxy: "loopback",
});

const authConfig = readAuthConfig();
const auth = createAuth(pool, authConfig);
await registerAuthRoutes(server, auth, authConfig);

pool.on("error", (error) => {
  server.log.error({ err: error }, "Idle database connection failed");
});

server.get("/health", async () => {
  return { ok: true };
});

server.get("/health/db", async (_request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    server.log.error({ err: error }, "Database health check failed");
    return reply.code(503).send({ ok: false });
  }
});

server.addHook("onClose", async () => {
  await pool.end();
});

async function shutdown() {
  try {
    await server.close();
  } catch (error) {
    server.log.error({ err: error }, "API shutdown failed");
    process.exitCode = 1;
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await server.listen({ host: "127.0.0.1", port: 3001 });
