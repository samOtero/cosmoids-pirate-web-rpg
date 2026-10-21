import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import Fastify from 'fastify';
import { makeProfile } from './.generated/data-builders.mjs';
import { createAuth } from '../src/auth.ts';
import { registerAuthRoutes } from '../src/auth-routes.ts';
import { registerAdminRoutes } from '../src/admin-routes.ts';
import { readAdminAccounts } from '../src/admin-config.ts';
import { loadGameContent } from '../src/game-content.ts';
import { ProfileRepository } from '../src/profile-repository.ts';
import { CreatureLocationCode as Location } from '../src/game-save-values.ts';
import {
  databaseTest,
  fixture,
  testAuthConfig as config,
} from './helpers/game-database.mjs';

const content = await loadGameContent();
const origin = 'https://game.example.com';

test('admin access defaults to nobody and accepts exact private ID/email pairs', () => {
  assert.equal(readAdminAccounts({}).size, 0);
  assert.equal(readAdminAccounts({ ADMIN_ACCOUNTS: '[]' }).size, 0);
  assert.deepEqual(
    [
      ...readAdminAccounts({
        ADMIN_ACCOUNTS: JSON.stringify([
          { id: 'captain-1', email: 'one@example.test' },
          { id: 'captain-2', email: 'two@example.test' },
        ]),
      }),
    ],
    [
      ['captain-1', 'one@example.test'],
      ['captain-2', 'two@example.test'],
    ]
  );
  assert.throws(
    () => readAdminAccounts({ ADMIN_ACCOUNT_IDS: 'captain-1' }),
    /Replace ADMIN_ACCOUNT_IDS/
  );
  for (const value of [
    'invalid json',
    '{}',
    '[null]',
    '["captain-1"]',
    JSON.stringify([{ id: 'captain-1' }]),
    JSON.stringify([{ id: '*', email: 'one@example.test' }]),
    JSON.stringify([{ id: 'not an id', email: 'one@example.test' }]),
    JSON.stringify([{ id: 'captain-1', email: '*' }]),
    JSON.stringify([
      { id: 'captain-1', email: 'one@example.test', extra: true },
    ]),
    JSON.stringify([
      { id: 'captain-1', email: 'one@example.test' },
      { id: 'captain-1', email: 'two@example.test' },
    ]),
  ])
    assert.throws(
      () => readAdminAccounts({ ADMIN_ACCOUNTS: value }),
      /ADMIN_ACCOUNTS must/
    );
});

async function setup(t) {
  const { pool, client } = await fixture(t);
  const auth = createAuth(pool, config);
  const accounts = new Map();
  const server = Fastify({ trustProxy: 'loopback' });
  await registerAuthRoutes(server, auth, config);
  await registerAdminRoutes(
    server,
    auth,
    config,
    pool,
    accounts,
    content.maxProfiles
  );
  await server.ready();
  t.after(() => server.close());
  async function login(name) {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      headers: { origin },
      payload: {
        name,
        email: randomUUID() + '@example.test',
        password: 'controlled-admin-test-password',
      },
    });
    assert.equal(response.statusCode, 200, response.body);
    return {
      user: response.json().user,
      cookie: [response.headers['set-cookie']]
        .flat()
        .map((value) => value.split(';', 1)[0])
        .join('; '),
    };
  }
  const admin = await login('Administrator');
  const player = await login('Inspectable player');
  accounts.set(admin.user.id, admin.user.email);
  const call = (url, headers = {}, method = 'GET') =>
    server.inject({
      method,
      url: '/api/admin' + url,
      headers: { origin, cookie: admin.cookie, ...headers },
    });
  const p = makeProfile({ name: 'Saved adventure' });
  const { id, ownerId, version, creatures, storageCreatures, ...profileData } =
    p;
  const repository = new ProfileRepository(pool, content);
  const profile = await repository.create(player.user.id, 0, {
    profileVersion: version,
    profileData,
    creatures: [],
    storageCreatures: [],
  });
  async function addCreature(location, position, selectedProfile = profile.id) {
    const id = randomUUID();
    await client.query(
      `INSERT INTO player_creatures (id, owner_account_id, original_owner_id, profile_id, location, position, species_id, gender, level, xp, equipped_attack_ids)
      VALUES ($1,$2,$3,$4,$5,$6,$7,0,3,17,$8)`,
      [
        id,
        player.user.id,
        admin.user.id,
        selectedProfile,
        location,
        position,
        content.species[0].id,
        [content.attackIds[0]],
      ]
    );
    return id;
  }
  const party = await addCreature(Location.PARTY, 0);
  const storage = await addCreature(Location.STORAGE, 0);
  const boxed = await addCreature(Location.TRADE_BOX, 0, null);
  return {
    pool,
    client,
    server,
    admin,
    player,
    accounts,
    call,
    profile,
    party,
    storage,
    boxed,
    addCreature,
  };
}

databaseTest(
  'all admin reads require a live session and explicit admin membership',
  async (t) => {
    const { call, admin, player, accounts, profile, party, server, client } =
      await setup(t);
    const paths = [
      '/session',
      '/accounts',
      '/accounts/' + player.user.id,
      '/profiles/' + profile.id,
      `/accounts/${player.user.id}/creatures?location=party&profileId=${profile.id}`,
      '/creatures/' + party,
    ];
    for (const path of paths) {
      for (const cookie of ['', 'better-auth.session_token=forged'])
        assert.equal((await call(path, { cookie })).statusCode, 401);
      assert.equal(
        (await call(path, { cookie: player.cookie })).statusCode,
        403
      );
      assert.equal((await call(path)).statusCode, 200);
    }
    accounts.clear();
    assert.equal((await call('/accounts')).statusCode, 403);
    accounts.set(admin.user.id, admin.user.email);
    await client.query(
      'UPDATE session SET "expiresAt" = CURRENT_TIMESTAMP - interval \'1 minute\' WHERE "userId" = $1',
      [admin.user.id]
    );
    assert.equal((await call('/accounts')).statusCode, 401);
    await server.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie: player.cookie, origin },
    });
    accounts.set(player.user.id, player.user.email);
    assert.equal(
      (await call('/accounts', { cookie: player.cookie })).statusCode,
      401
    );
  }
);

databaseTest(
  'admin permission requires one complete pair and follows the current database email',
  async (t) => {
    const { call, admin, player, accounts, profile, party, client } =
      await setup(t);
    const paths = [
      '/session',
      '/accounts',
      '/accounts/' + player.user.id,
      '/profiles/' + profile.id,
      `/accounts/${player.user.id}/creatures?location=party&profileId=${profile.id}`,
      '/creatures/' + party,
    ];
    // An ID from one entry and email from another must not combine into access.
    accounts.set(admin.user.id, player.user.email);
    accounts.set(player.user.id, admin.user.email);
    for (const path of paths) {
      assert.equal((await call(path)).statusCode, 403);
      assert.equal(
        (await call(path, { cookie: player.cookie })).statusCode,
        403
      );
    }
    accounts.clear();
    accounts.set(admin.user.id, admin.user.email.toUpperCase());
    assert.equal((await call('/session')).statusCode, 403);
    accounts.set(admin.user.id, admin.user.email);
    assert.equal((await call('/session')).statusCode, 200);

    const newEmail = randomUUID() + '@example.test';
    await client.query('UPDATE "user" SET email = $1 WHERE id = $2', [
      newEmail,
      admin.user.id,
    ]);
    // The existing cookie must not keep the old email authorized.
    for (const path of paths) assert.equal((await call(path)).statusCode, 403);
    accounts.set(admin.user.id, newEmail);
    assert.equal((await call('/session')).statusCode, 200);

    // Reusing the old email under another account ID does not grant access.
    accounts.set(admin.user.id, admin.user.email);
    await client.query('UPDATE "user" SET email = $1 WHERE id = $2', [
      admin.user.email,
      player.user.id,
    ]);
    assert.equal(
      (await call('/session', { cookie: player.cookie })).statusCode,
      403
    );
  }
);

databaseTest(
  'admin account/profile/creature inspection preserves ownership and exposes no credentials',
  async (t) => {
    const { call, player, admin, profile, party, storage, boxed, client } =
      await setup(t);
    const before = (await client.query('SELECT * FROM game_profiles')).rows;
    const list = await call(
      '/accounts?q=' + encodeURIComponent(player.user.email)
    );
    assert.equal(list.statusCode, 200, list.body);
    assert.equal(list.headers['cache-control'], 'no-store');
    assert.equal(list.headers['x-robots-tag'], 'noindex, nofollow');
    assert.equal(list.json().total, 1);
    assert.equal(list.json().items[0].profileCount, 1);
    assert.equal(list.json().items[0].creatureCount, 3);
    assert.deepEqual(
      Object.keys(list.json().items[0]).sort(),
      [
        'id',
        'name',
        'email',
        'emailVerified',
        'createdAt',
        'updatedAt',
        'profileCount',
        'creatureCount',
      ].sort()
    );
    for (const q of [player.user.id, 'Inspectable'])
      assert.equal((await call('/accounts?q=' + q)).json().total, 1);
    const account = (await call('/accounts/' + player.user.id)).json();
    assert.equal(account.slots.length, content.maxProfiles);
    assert.equal(account.slots[0].id, profile.id);
    assert.equal(account.slots[1], null);
    assert.equal(account.tradeBox.creatureCount, 1);
    assert.equal((await call('/profiles/' + profile.id)).json().revision, 1);
    for (const [location, id] of [
      ['party', party],
      ['storage', storage],
      ['tradeBox', boxed],
    ]) {
      const q = new URLSearchParams({
        location,
        ...(location === 'tradeBox' ? {} : { profileId: profile.id }),
      });
      const result = (
        await call(`/accounts/${player.user.id}/creatures?${q}`)
      ).json();
      assert.equal(result.total, 1);
      assert.equal(result.items[0].id, id);
      assert.equal(result.items[0].location, location);
      const creature = (await call('/creatures/' + id)).json();
      assert.equal(creature.accountId, player.user.id);
      assert.equal(creature.originalOwnerId, admin.user.id);
      assert.equal(
        creature.profileId,
        location === 'tradeBox' ? null : profile.id
      );
      assert.equal(creature.xp, 17);
      assert.equal(creature.gender, 'genderless');
    }
    assert.deepEqual(
      (await client.query('SELECT * FROM game_profiles')).rows,
      before
    );
    for (const method of ['POST', 'PUT', 'DELETE'])
      assert.equal(
        (await call('/profiles/' + profile.id, {}, method)).statusCode,
        404
      );
  }
);

databaseTest(
  'admin queries validate pagination, safely search text, and scope profile collections to accounts',
  async (t) => {
    const { call, player, admin, profile, addCreature } = await setup(t);
    for (let i = 1; i < 28; i++) await addCreature(Location.STORAGE, i);
    const path = `/accounts/${player.user.id}/creatures?location=storage&profileId=${profile.id}`;
    const first = (await call(path + '&limit=10&offset=0')).json();
    const second = (await call(path + '&limit=10&offset=10')).json();
    assert.equal(first.total, 28);
    assert.equal(first.items.length, 10);
    assert.equal(second.items[0].position, 10);
    assert.ok(
      !first.items.some((a) => second.items.some((b) => a.id === b.id))
    );
    const beyond = (await call(path + '&offset=100')).json();
    assert.equal(beyond.total, 28);
    assert.deepEqual(beyond.items, []);
    assert.equal(
      (
        await call(
          `/accounts/${admin.user.id}/creatures?location=party&profileId=${profile.id}`
        )
      ).statusCode,
      404
    );
    for (const query of [
      'limit=0',
      'limit=51',
      'offset=-1',
      'limit=1.5',
      'offset=1000001',
    ])
      assert.equal((await call('/accounts?' + query)).statusCode, 400);
    assert.equal(
      (await call('/accounts?q=' + encodeURIComponent("%' OR 1=1 --"))).json()
        .total,
      0
    );
    for (const query of [
      'location=bad',
      'location=party',
      `location=tradeBox&profileId=${profile.id}`,
    ])
      assert.equal(
        (await call(`/accounts/${player.user.id}/creatures?${query}`))
          .statusCode,
        400
      );
    assert.equal((await call('/profiles/not-a-uuid')).statusCode, 400);
    assert.equal((await call('/accounts/missing')).statusCode, 404);
    assert.equal((await call('/creatures/missing')).statusCode, 404);
    assert.equal(
      (await call('/accounts', { origin: 'https://untrusted.example' }))
        .statusCode,
      403
    );
  }
);

databaseTest(
  'admin database failures return a generic error and leave saves untouched',
  async (t) => {
    const { pool, admin, profile, client } = await setup(t);
    const failing = Fastify();
    await registerAdminRoutes(
      failing,
      createAuth(pool, config),
      config,
      {
        connect: async () => {
          throw new Error('private connection detail');
        },
      },
      new Map([[admin.user.id, admin.user.email]]),
      content.maxProfiles
    );
    t.after(() => failing.close());
    const response = await failing.inject({
      method: 'GET',
      url: '/api/admin/accounts',
      headers: { origin, cookie: admin.cookie },
    });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().code, 'ADMIN_UNAVAILABLE');
    assert.ok(!response.body.includes('private connection detail'));
    assert.equal(
      (
        await client.query('SELECT revision FROM game_profiles WHERE id=$1', [
          profile.id,
        ])
      ).rows[0].revision,
      1
    );
  }
);
