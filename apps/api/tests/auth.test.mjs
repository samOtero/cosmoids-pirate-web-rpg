import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import Fastify from 'fastify';
import pg from 'pg';
import { getMigrations } from 'better-auth/db/migration';
import { readAuthConfig } from '../src/auth-config.ts';
import { createAuth } from '../src/auth.ts';
import { registerAuthRoutes } from '../src/auth-routes.ts';

const config = readAuthConfig({
  NODE_ENV: 'production',
  BETTER_AUTH_URL: 'https://api.example.com',
  BETTER_AUTH_SECRET: randomBytes(32).toString('base64'),
  AUTH_TRUSTED_ORIGINS: 'https://game.example.com',
});

async function fixture(t) {
  // Default tests use SQLite in memory. An explicit test connection enables
  // the same checks on Postgres, isolated in a unique disposable schema.
  let database;
  if (process.env.AUTH_TEST_DATABASE_URL) {
    const schema = 'auth_test_' + randomUUID().replaceAll('-', '');
    database = new pg.Pool({
      connectionString: process.env.AUTH_TEST_DATABASE_URL,
      options: `-c search_path=${schema}`,
    });
    await database.query(`CREATE SCHEMA "${schema}"`);
    t.after(async () => {
      try {
        await database.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await database.end();
      }
    });
  } else {
    database = new DatabaseSync(':memory:');
    t.after(() => database.close());
  }
  const auth = createAuth(database, config);
  await (await getMigrations(auth.options)).runMigrations();
  const server = Fastify({ trustProxy: 'loopback' });
  await registerAuthRoutes(server, auth, config);
  await server.ready();
  t.after(() => server.close());
  return { server, database, auth };
}

function cookies(response) {
  const value = response.headers['set-cookie'];
  return (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((cookie) => cookie.split(';', 1)[0])
    .join('; ');
}

function post(server, path, payload, extraHeaders = {}) {
  return server.inject({
    method: 'POST',
    url: '/api/auth/' + path,
    payload,
    headers: { origin: config.baseURL, ...extraHeaders },
  });
}

test('signup, wrong password, login, and logout use persistent sessions', async (t) => {
  const { server, database } = await fixture(t);
  const user = {
    name: 'Test player',
    email: 'player@example.com',
    password: 'test-password-long-enough',
  };
  assert.equal((await server.inject('/api/me')).statusCode, 401);

  const signup = await post(server, 'sign-up/email', user);
  assert.equal(signup.statusCode, 200, signup.body);
  const setCookies = [signup.headers['set-cookie']].flat();
  assert.ok(
    setCookies.some(
      (cookie) => /HttpOnly/i.test(cookie) && /Secure/i.test(cookie)
    )
  );
  const cookie = cookies(signup);
  const me = await server.inject({ url: '/api/me', headers: { cookie } });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.email, user.email);
  assert.equal(me.json().user.emailVerified, false);
  assert.equal(me.headers['cache-control'], 'no-store');
  assert.equal(me.json().session, undefined);

  const restarted = Fastify({ trustProxy: 'loopback' });
  await registerAuthRoutes(restarted, createAuth(database, config), config);
  t.after(() => restarted.close());
  const resumed = await restarted.inject({
    url: '/api/me',
    headers: { cookie },
  });
  assert.equal(resumed.statusCode, 200);
  assert.equal(resumed.json().user.id, me.json().user.id);
  const repeatedPlan = await getMigrations(
    createAuth(database, config).options
  );
  assert.equal(repeatedPlan.toBeCreated.length, 0);
  assert.equal(repeatedPlan.toBeAdded.length, 0);
  assert.equal(repeatedPlan.toBeAddedIndexes.length, 0);

  const hash =
    database instanceof DatabaseSync
      ? database.prepare('SELECT password FROM "account"').get().password
      : (await database.query('SELECT password FROM "account"')).rows[0]
          .password;
  assert.ok(hash && hash !== user.password);
  assert.ok(!hash.includes(user.password));

  const wrong = await post(server, 'sign-in/email', {
    email: user.email,
    password: 'incorrect-password',
  });
  assert.equal(wrong.statusCode, 401, wrong.body);
  const login = await post(server, 'sign-in/email', {
    email: user.email,
    password: user.password,
  });
  assert.equal(login.statusCode, 200, login.body);
  const loginCookie = cookies(login);
  const logout = await post(server, 'sign-out', {}, { cookie: loginCookie });
  assert.equal(logout.statusCode, 200, logout.body);
  assert.equal(
    (await server.inject({ url: '/api/me', headers: { cookie: loginCookie } }))
      .statusCode,
    401
  );
});

test('signup rejects short passwords and requests from an untrusted website', async (t) => {
  const { server } = await fixture(t);
  const user = {
    name: 'Player',
    email: 'other@example.com',
    password: 'test-password-long-enough',
  };
  const short = await post(server, 'sign-up/email', {
    ...user,
    password: 'short',
  });
  assert.equal(short.statusCode, 400, short.body);
  const untrusted = await post(server, 'sign-up/email', user, {
    origin: 'https://untrusted.example',
  });
  assert.equal(untrusted.statusCode, 403, untrusted.body);
  assert.equal(untrusted.headers['access-control-allow-origin'], undefined);
  const preflight = await server.inject({
    method: 'OPTIONS',
    url: '/api/auth/sign-up/email',
    headers: {
      origin: 'https://game.example.com',
      'access-control-request-method': 'POST',
    },
  });
  assert.equal(preflight.statusCode, 204);
  assert.equal(
    preflight.headers['access-control-allow-origin'],
    'https://game.example.com'
  );
  assert.equal(preflight.headers['access-control-allow-credentials'], 'true');
});

test('spoofing IP headers does not bypass login limits', async (t) => {
  const { server } = await fixture(t);
  const user = {
    name: 'Player',
    email: 'limited@example.com',
    password: 'test-password-long-enough',
  };
  assert.equal((await post(server, 'sign-up/email', user)).statusCode, 200);
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await post(
      server,
      'sign-in/email',
      { email: user.email, password: 'incorrect-password' },
      {
        'x-cosmoids-client-ip': `203.0.113.${attempt + 1}`,
        'x-forwarded-for': `203.0.113.${attempt + 1}, 198.51.100.10`,
      }
    );
    assert.equal(response.statusCode, 401, response.body);
  }
  const limited = await post(
    server,
    'sign-in/email',
    { email: user.email, password: user.password },
    {
      'x-cosmoids-client-ip': '203.0.113.99',
      'x-forwarded-for': '203.0.113.99, 198.51.100.10',
    }
  );
  assert.equal(limited.statusCode, 429, limited.body);
});

test('Fastify preserves separate cookies and ignores a forged Host header', async (t) => {
  const server = Fastify();
  t.after(() => server.close());
  const auth = {
    async handler(request) {
      assert.equal(new URL(request.url).origin, config.baseURL);
      assert.equal(request.headers.get('x-cosmoids-client-ip'), '192.0.2.10');
      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('Set-Cookie', 'first=a; Path=/; HttpOnly');
      headers.append('Set-Cookie', 'second=b; Path=/; HttpOnly');
      return new Response('{"ok":true}', { headers });
    },
    api: {
      async getSession() {
        return null;
      },
    },
  };
  await registerAuthRoutes(server, auth, config);
  const response = await server.inject({
    method: 'POST',
    url: '/api/auth/test',
    payload: {},
    remoteAddress: '192.0.2.10',
    headers: { host: 'forged.example', 'x-cosmoids-client-ip': '203.0.113.99' },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.headers['set-cookie'], [
    'first=a; Path=/; HttpOnly',
    'second=b; Path=/; HttpOnly',
  ]);
});

test('production auth requires a secret and HTTPS origins', () => {
  const env = {
    NODE_ENV: 'production',
    BETTER_AUTH_SECRET: randomBytes(32).toString('base64'),
    BETTER_AUTH_URL: config.baseURL,
  };
  assert.throws(() => readAuthConfig({ ...env, BETTER_AUTH_SECRET: 'short' }));
  assert.throws(() => readAuthConfig({ ...env, BETTER_AUTH_URL: undefined }));
  for (const url of [
    'http://api.example.com',
    'https://api.example.com/path',
    'https://name:password@api.example.com',
    'https://*.example.com',
  ]) {
    assert.throws(() => readAuthConfig({ ...env, BETTER_AUTH_URL: url }));
  }
  assert.throws(() =>
    readAuthConfig({
      ...env,
      AUTH_TRUSTED_ORIGINS: 'https://game.example.com,http://untrusted.example',
    })
  );
});
