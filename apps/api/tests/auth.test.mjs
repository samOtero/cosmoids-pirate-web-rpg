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

async function fixture(t, { recovery = true } = {}) {
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
  const resetEmails = [];
  const auth = createAuth(
    database,
    config,
    recovery ? (email, url) => resetEmails.push({ email, url }) : undefined
  );
  await (await getMigrations(auth.options)).runMigrations();
  const server = Fastify({ trustProxy: 'loopback' });
  await registerAuthRoutes(server, auth, config);
  await server.ready();
  t.after(() => server.close());
  return { server, database, auth, resetEmails };
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

const recoveryUser = {
  name: 'Recover captain',
  email: 'recovery@example.test',
  password: 'old-controlled-password-123',
};
const redirectTo = 'https://game.example.com/reset-password';
function resetToken(email) {
  const url = new URL(email.url);
  assert.equal(url.origin + url.pathname, redirectTo);
  assert.equal(url.search, '');
  return new URLSearchParams(url.hash.slice(1)).get('token');
}

test('reset requests conceal account existence and only deliver to the registered address', async (t) => {
  const { server, resetEmails } = await fixture(t);
  await post(server, 'sign-up/email', recoveryUser);
  const missing = await post(server, 'request-password-reset', {
    email: 'missing@example.test',
    redirectTo,
  });
  const existing = await post(server, 'request-password-reset', {
    email: recoveryUser.email,
    redirectTo,
  });
  assert.equal(missing.statusCode, 200, missing.body);
  assert.equal(existing.statusCode, 200, existing.body);
  assert.deepEqual(existing.json(), missing.json());
  assert.equal(resetEmails.length, 1);
  assert.equal(resetEmails[0].email, recoveryUser.email);
  assert.ok(resetToken(resetEmails[0]));
  assert.equal(existing.headers['cache-control'], 'no-store');
  assert.equal(existing.headers['referrer-policy'], 'no-referrer');
  assert.ok(!existing.body.includes(resetToken(resetEmails[0])));
});

test('reset changes the password, signs out existing sessions and cannot be replayed', async (t) => {
  const { server, resetEmails } = await fixture(t);
  const signup = await post(server, 'sign-up/email', recoveryUser);
  const cookie = cookies(signup);
  await post(server, 'request-password-reset', {
    email: recoveryUser.email,
    redirectTo,
  });
  const token = resetToken(resetEmails[0]);
  const newPassword = 'new-controlled-password-456';
  const short = await post(server, 'reset-password', {
    token,
    newPassword: 'short',
  });
  assert.equal(short.statusCode, 400, short.body);
  const changed = await post(server, 'reset-password', { token, newPassword });
  assert.equal(changed.statusCode, 200, changed.body);
  assert.equal(
    (await server.inject({ url: '/api/me', headers: { cookie } })).statusCode,
    401
  );
  assert.equal(
    (
      await post(server, 'sign-in/email', {
        email: recoveryUser.email,
        password: recoveryUser.password,
      })
    ).statusCode,
    401
  );
  assert.equal(
    (
      await post(server, 'sign-in/email', {
        email: recoveryUser.email,
        password: newPassword,
      })
    ).statusCode,
    200
  );
  const reused = await post(server, 'reset-password', {
    token,
    newPassword: 'another-password-789',
  });
  assert.equal(reused.statusCode, 400, reused.body);
  assert.equal(reused.json().code, 'INVALID_TOKEN');
});

test('expired and forged reset tokens cannot change a password', async (t) => {
  const { server, auth, resetEmails } = await fixture(t);
  await post(server, 'sign-up/email', recoveryUser);
  await post(server, 'request-password-reset', {
    email: recoveryUser.email,
    redirectTo,
  });
  const token = resetToken(resetEmails[0]);
  const context = await auth.$context;
  const verification = await context.internalAdapter.findVerificationValue(
    `reset-password:${token}`
  );
  assert.ok(verification.expiresAt.getTime() <= Date.now() + 30 * 60 * 1000);
  await context.internalAdapter.updateVerificationByIdentifier(
    `reset-password:${token}`,
    { expiresAt: new Date(0) }
  );
  for (const value of [token, 'forged-token']) {
    const result = await post(server, 'reset-password', {
      token: value,
      newPassword: 'replacement-password-123',
    });
    assert.equal(result.statusCode, 400, result.body);
    assert.equal(result.json().code, 'INVALID_TOKEN');
  }
  assert.equal(
    (
      await post(server, 'sign-in/email', {
        email: recoveryUser.email,
        password: recoveryUser.password,
      })
    ).statusCode,
    200
  );
});

test('recovery rejects foreign origins and unsafe destinations before sending mail', async (t) => {
  const { server, resetEmails } = await fixture(t);
  await post(server, 'sign-up/email', recoveryUser);
  for (const destination of [
    undefined,
    'https://evil.example/reset-password',
    'https://game.example.com/other',
    `${redirectTo}?next=https://evil.example`,
  ]) {
    const response = await post(server, 'request-password-reset', {
      email: recoveryUser.email,
      redirectTo: destination,
    });
    assert.equal(response.statusCode, 400, response.body);
  }
  const untrusted = await post(
    server,
    'request-password-reset',
    { email: recoveryUser.email, redirectTo },
    { origin: 'https://evil.example' }
  );
  assert.equal(untrusted.statusCode, 403, untrusted.body);
  assert.equal(resetEmails.length, 0);
});

test('reset email requests and password attempts are rate limited', async (t) => {
  const { server } = await fixture(t);
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.equal(
      (
        await post(server, 'request-password-reset', {
          email: 'missing@example.test',
          redirectTo,
        })
      ).statusCode,
      200
    );
  }
  assert.equal(
    (
      await post(server, 'request-password-reset', {
        email: 'missing@example.test',
        redirectTo,
      })
    ).statusCode,
    429
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal(
      (
        await post(server, 'reset-password', {
          token: 'forged',
          newPassword: 'controlled-password-123',
        })
      ).statusCode,
      400
    );
  }
  assert.equal(
    (
      await post(server, 'reset-password', {
        token: 'forged',
        newPassword: 'controlled-password-123',
      })
    ).statusCode,
    429
  );
});

test('unconfigured email delivery disables recovery for every address', async (t) => {
  const { server } = await fixture(t, { recovery: false });
  for (const email of [recoveryUser.email, 'missing@example.test']) {
    const response = await post(server, 'request-password-reset', {
      email,
      redirectTo,
    });
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.json().code, 'RESET_PASSWORD_DISABLED');
  }
});
