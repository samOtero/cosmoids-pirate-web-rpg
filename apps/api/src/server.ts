import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/health", async () => {
  return { ok: true };
});

await server.listen({ host: "127.0.0.1", port: 3001 });
