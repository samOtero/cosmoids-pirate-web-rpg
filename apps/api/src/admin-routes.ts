import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import type { AuthConfig } from './auth-config.js';
import type { GameAuth } from './auth.js';
import { authHeaders } from './auth-request.js';
import { AdminRepository } from './admin-repository.js';
import { CreatureLocationCode } from './game-save-values.js';
import { profileId, SaveError } from './profile-validation.js';

function identifier(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200)
    throw new SaveError(400, 'INVALID_REQUEST', 'Invalid record ID.');
  return value;
}
function page(query: Record<string, unknown>) {
  function integer(value: unknown, fallback: number, max: number) {
    if (value === undefined) return fallback;
    if (
      typeof value !== 'string' ||
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) > max
    )
      throw new SaveError(400, 'INVALID_REQUEST', 'Invalid pagination.');
    return Number(value);
  }
  const limit = integer(query.limit, 25, 50);
  if (!limit)
    throw new SaveError(400, 'INVALID_REQUEST', 'Invalid pagination.');
  return { limit, offset: integer(query.offset, 0, 1_000_000) };
}

export async function registerAdminRoutes(
  server: FastifyInstance,
  auth: GameAuth,
  config: AuthConfig,
  pool: Pool,
  adminAccounts: ReadonlyMap<string, string>,
  maxProfiles: number
) {
  const repository = new AdminRepository(pool, maxProfiles);
  await server.register(async (routes) => {
    routes.addHook('onRequest', async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('X-Robots-Tag', 'noindex, nofollow');
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
          error: 'Log in to access administration.',
        });
      if (adminAccounts.get(session.user.id) !== session.user.email)
        return reply.code(403).send({
          code: 'ADMIN_REQUIRED',
          error: 'This account does not have admin access.',
        });
      if (
        request.headers.origin !== undefined &&
        !config.trustedOrigins.includes(request.headers.origin)
      )
        return reply.code(403).send({
          code: 'UNTRUSTED_ORIGIN',
          error: 'This website is not allowed to access administration.',
        });
    });
    routes.setErrorHandler((error, request, reply) => {
      if (error instanceof SaveError)
        return reply
          .code(error.status)
          .send({ code: error.code, error: error.message });
      request.log.error(
        { code: (error as { code?: string }).code },
        'Admin inspection failed'
      );
      return reply.code(503).send({
        code: 'ADMIN_UNAVAILABLE',
        error: 'Administration is temporarily unavailable. Try again.',
      });
    });
    routes.get('/api/admin/session', async () => ({ allowed: true }));
    routes.get<{ Querystring: Record<string, unknown> }>(
      '/api/admin/accounts',
      async (request) => {
        const { q = '' } = request.query;
        if (typeof q !== 'string' || q.length > 200)
          throw new SaveError(
            400,
            'INVALID_REQUEST',
            'Search must be at most 200 characters.'
          );
        const { limit, offset } = page(request.query);
        return repository.accounts(q.trim(), limit, offset);
      }
    );
    routes.get<{ Params: { id: string } }>(
      '/api/admin/accounts/:id',
      (request) => repository.account(identifier(request.params.id))
    );
    routes.get<{ Params: { id: string } }>(
      '/api/admin/profiles/:id',
      (request) => repository.profile(profileId(request.params.id))
    );
    routes.get<{
      Params: { id: string };
      Querystring: Record<string, unknown>;
    }>('/api/admin/accounts/:id/creatures', (request) => {
      const { location, profileId: requestedProfile } = request.query;
      const codes = {
        party: CreatureLocationCode.PARTY,
        storage: CreatureLocationCode.STORAGE,
        tradeBox: CreatureLocationCode.TRADE_BOX,
      };
      if (typeof location !== 'string' || !Object.hasOwn(codes, location))
        throw new SaveError(
          400,
          'INVALID_REQUEST',
          'Choose party, storage or tradeBox.'
        );
      if (location === 'tradeBox' && requestedProfile !== undefined)
        throw new SaveError(
          400,
          'INVALID_REQUEST',
          'Trade-box creatures have no profile.'
        );
      const selectedProfile =
        location === 'tradeBox' ? null : profileId(requestedProfile);
      const { limit, offset } = page(request.query);
      return repository.creatures(
        identifier(request.params.id),
        codes[location as keyof typeof codes],
        selectedProfile,
        limit,
        offset
      );
    });
    routes.get<{ Params: { id: string } }>(
      '/api/admin/creatures/:id',
      (request) => repository.creature(identifier(request.params.id))
    );
  });
}
