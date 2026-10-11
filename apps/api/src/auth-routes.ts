import cors from '@fastify/cors';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthConfig } from './auth-config.js';
import type { GameAuth } from './auth.js';

export async function registerAuthRoutes(
  server: FastifyInstance,
  auth: GameAuth,
  config: AuthConfig
) {
  await server.register(cors, {
    origin: config.trustedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  function authHeaders(request: FastifyRequest) {
    const headers = fromNodeHeaders(request.headers);
    // Never trust a client-supplied IP header. Fastify resolves the address
    // using the socket and only the configured trusted reverse proxy.
    headers.set('x-cosmoids-client-ip', request.ip);
    headers.delete('x-forwarded-for');
    headers.delete('x-forwarded-host');
    headers.delete('x-forwarded-proto');
    headers.delete('content-length');
    return headers;
  }

  server.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      reply.header('Cache-Control', 'no-store');
      const response = await auth.handler(
        new Request(config.baseURL + request.url, {
          method: request.method,
          headers: authHeaders(request),
          ...(request.body !== undefined
            ? { body: JSON.stringify(request.body) }
            : {}),
        })
      );

      reply.code(response.status);
      response.headers.forEach((value, name) => {
        if (name !== 'set-cookie') reply.header(name, value);
      });
      // Cookies must be separate headers; joining them breaks browser handling.
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  server.get('/api/me', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const session = await auth.api.getSession({
      headers: authHeaders(request),
    });
    if (!session) return reply.code(401).send({ error: 'Unauthorized' });

    const { id, name, email, emailVerified } = session.user;
    return { user: { id, name, email, emailVerified } };
  });
}
