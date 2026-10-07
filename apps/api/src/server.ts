import Fastify from "fastify";
import { pool } from "./database.js";

const server = Fastify({ logger: true });

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
