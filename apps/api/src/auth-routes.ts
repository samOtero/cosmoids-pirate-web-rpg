import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import type { AuthConfig } from './auth-config.js';
import type { GameAuth } from './auth.js';
import { authHeaders } from './auth-request.js';
import { passwordResetDestination } from './password-reset-email.js';

export async function registerAuthRoutes(
  server: FastifyInstance,
  auth: GameAuth,
  config: AuthConfig
) {
  await server.register(cors, {
    origin: config.trustedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });

  server.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      reply.header('Cache-Control', 'no-store');
      reply.header('Referrer-Policy', 'no-referrer');
      if (
        request.method === 'POST' &&
        [
          '/api/auth/request-password-reset',
          '/api/auth/reset-password',
        ].includes(request.url.split('?')[0])
      ) {
        const origin = request.headers.origin;
        if (origin && !config.trustedOrigins.includes(origin)) {
          return reply
            .code(403)
            .send({ code: 'INVALID_ORIGIN', message: 'Invalid origin' });
        }
      }
      if (
        request.method === 'POST' &&
        request.url.split('?')[0] === '/api/auth/request-password-reset'
      ) {
        const destination = (request.body as { redirectTo?: unknown } | null)
          ?.redirectTo;
        if (!passwordResetDestination(destination, config.trustedOrigins)) {
          return reply.code(400).send({
            code: 'INVALID_RESET_DESTINATION',
            message: 'Invalid reset destination',
          });
        }
      }
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
