import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';

export function authHeaders(request: FastifyRequest) {
  const headers = fromNodeHeaders(request.headers);
  // Only Fastify's trusted-proxy resolution can establish the client address.
  headers.set('x-cosmoids-client-ip', request.ip);
  for (const name of [
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'content-length',
  ])
    headers.delete(name);
  return headers;
}
