import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPasswordResetEmail,
  passwordResetDestination,
} from '../src/password-reset-email.ts';
import { loggedRequestURL } from '../src/request-logging.ts';

test('email configuration is optional but partial configuration fails', () => {
  assert.equal(createPasswordResetEmail({}), undefined);
  for (const env of [
    { RESEND_API_KEY: 'test-key' },
    { PASSWORD_RESET_FROM: 'test@example.test' },
    { RESEND_API_KEY: 'test-key', PASSWORD_RESET_FROM: 'x\r\nother' },
  ]) {
    assert.throws(() => createPasswordResetEmail(env), /Configure/);
  }
});

test('Resend delivery uses the server credential and plain-text recovery link', async () => {
  let resolveDelivery;
  let request;
  const delivery = new Promise((resolve) => {
    resolveDelivery = resolve;
  });
  const mail = createPasswordResetEmail(
    {
      RESEND_API_KEY: 'controlled-secret',
      PASSWORD_RESET_FROM: 'Cosmoids <accounts@example.test>',
    },
    async (url, options) => {
      request = { url, options };
      return delivery;
    }
  );
  assert.equal(
    mail.send(
      'captain@example.test',
      'https://game.example.test/reset-password#token=controlled-token'
    ),
    undefined
  );
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(
    request.options.headers.Authorization,
    'Bearer controlled-secret'
  );
  assert.ok(request.options.signal instanceof AbortSignal);
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.to, ['captain@example.test']);
  assert.equal(body.from, 'Cosmoids <accounts@example.test>');
  assert.match(body.text, /reset-password#token=controlled-token/);
  assert.match(body.text, /30 minutes/);
  resolveDelivery(new Response('{}', { status: 200 }));
  await mail.drain();
});

test('provider and network errors are contained without logging sensitive data', async () => {
  for (const transport of [
    async () => new Response('secret-provider-body', { status: 403 }),
    async () => {
      throw new Error('secret-network-url');
    },
  ]) {
    const reports = [];
    const mail = createPasswordResetEmail(
      { RESEND_API_KEY: 'test-key', PASSWORD_RESET_FROM: 'test@example.test' },
      transport,
      (...args) => reports.push(args)
    );
    mail.send('test@example.test', 'https://game.example.test/#secret');
    await mail.drain();
    assert.deepEqual(reports, [[]]);
  }
});

test('recovery destinations and logged URLs never allow token redirects or leaks', () => {
  const trusted = ['https://game.example.test'];
  assert.equal(
    passwordResetDestination(
      'https://game.example.test/reset-password',
      trusted
    ).href,
    'https://game.example.test/reset-password'
  );
  for (const value of [
    null,
    {},
    '/reset-password',
    'https://evil.test/reset-password',
    'https://game.example.test/other',
    'https://game.example.test/reset-password?next=https://evil.test',
    'https://game.example.test/reset-password#token=x',
    'https://user:password@game.example.test/reset-password',
  ]) {
    assert.equal(passwordResetDestination(value, trusted), null);
  }
  assert.equal(
    loggedRequestURL('/api/auth/reset-password/sensitive?callbackURL=secret'),
    '/api/auth/reset-password/[redacted]'
  );
  assert.equal(
    loggedRequestURL('/api/auth/reset-password?token=sensitive'),
    '/api/auth/reset-password'
  );
});
