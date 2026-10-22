import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import type { AuthConfig } from './auth-config.js';
import type { GameAuth } from './auth.js';
import type { GameContent } from './game-content.js';
import { authHeaders } from './auth-request.js';
import { ProfileRepository } from './profile-repository.js';
import {
  expectedRevision,
  object,
  profileId,
  SaveError,
  validateChanges,
  validateSnapshot,
} from './profile-validation.js';

declare module 'fastify' {
  interface FastifyRequest {
    authenticatedAccountId: string | null;
  }
}

export async function registerProfileRoutes(
  server: FastifyInstance,
  auth: GameAuth,
  config: AuthConfig,
  pool: Pool,
  content: GameContent
) {
  const repository = new ProfileRepository(pool, content);
  await server.register(async (protectedRoutes) => {
    protectedRoutes.decorateRequest('authenticatedAccountId', null);
    protectedRoutes.addHook('onRequest', async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      const { response: session, headers } = await auth.api.getSession({
        headers: authHeaders(request),
        query: { disableCookieCache: true },
        returnHeaders: true,
      });
      const cookies = headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      if (!session)
        return reply.code(401).send({
          code: 'UNAUTHENTICATED',
          error: 'Log in before accessing account saves.',
        });
      request.authenticatedAccountId = session.user.id;
      const origin = request.headers.origin;
      if (
        (origin !== undefined && !config.trustedOrigins.includes(origin)) ||
        (!['GET', 'HEAD'].includes(request.method) && origin === undefined)
      ) {
        return reply.code(403).send({
          code: 'UNTRUSTED_ORIGIN',
          error: 'This website is not allowed to change account saves.',
        });
      }
    });
    protectedRoutes.setErrorHandler((error, request, reply) => {
      if (error instanceof SaveError)
        return reply.code(error.status).send({
          code: error.code,
          error: error.message,
          ...(error.latest === undefined ? {} : { latest: error.latest }),
        });
      const databaseError = error as {
        code?: string;
        constraint?: string;
        statusCode?: number;
      };
      if (
        databaseError.code === '23505' &&
        databaseError.constraint === 'game_profiles_account_slot_unique'
      )
        return reply.code(409).send({
          code: 'SLOT_OCCUPIED',
          error: 'This save slot is already occupied. Refresh your save slots.',
        });
      if (
        databaseError.statusCode &&
        databaseError.statusCode >= 400 &&
        databaseError.statusCode < 500
      )
        return reply.code(databaseError.statusCode).send({
          code: 'INVALID_REQUEST',
          error: 'The save request is invalid or too large.',
        });
      request.log.error(
        { code: databaseError.code },
        'Account save request failed'
      );
      return reply.code(503).send({
        code: 'SAVE_UNAVAILABLE',
        error:
          'Saving is temporarily unavailable. Keep your progress and try again.',
      });
    });
    protectedRoutes.get('/api/profiles', async (request) =>
      repository.list(request.authenticatedAccountId!)
    );
    protectedRoutes.get<{ Params: { id: string } }>(
      '/api/profiles/:id',
      async (request) =>
        repository.load(
          request.authenticatedAccountId!,
          profileId(request.params.id)
        )
    );
    protectedRoutes.post(
      '/api/profiles',
      { bodyLimit: 1024 * 1024 },
      async (request, reply) => {
        const body = object(
          request.body,
          [
            'slot',
            'profileVersion',
            'profileData',
            'creatures',
            'storageCreatures',
          ],
          'Create request'
        );
        if (
          !Number.isInteger(body.slot) ||
          (body.slot as number) < 0 ||
          (body.slot as number) >= content.maxProfiles
        )
          throw new SaveError(
            400,
            'INVALID_SLOT',
            'Choose one of your three save slots.'
          );
        const created = await repository.create(
          request.authenticatedAccountId!,
          body.slot as number,
          validateSnapshot(body, content)
        );
        return reply.code(201).send(created);
      }
    );
    protectedRoutes.put<{ Params: { id: string } }>(
      '/api/profiles/:id',
      { bodyLimit: 1024 * 1024 },
      async (request) => {
        const body = object(
          request.body,
          [
            'expectedRevision',
            'profileVersion',
            'profileData',
            'creatureChanges',
          ],
          'Save request'
        );
        return repository.save(
          request.authenticatedAccountId!,
          profileId(request.params.id),
          expectedRevision(body.expectedRevision),
          validateChanges(body, content)
        );
      }
    );
    protectedRoutes.delete<{ Params: { id: string } }>(
      '/api/profiles/:id',
      async (request, reply) => {
        const body = object(
          request.body,
          ['expectedRevision'],
          'Delete request'
        );
        await repository.delete(
          request.authenticatedAccountId!,
          profileId(request.params.id),
          expectedRevision(body.expectedRevision)
        );
        return reply.code(204).send();
      }
    );
  });
}
