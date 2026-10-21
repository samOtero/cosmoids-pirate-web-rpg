import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import {
  makeProfile,
  makePlayerCreature,
} from './.generated/data-builders.mjs';
import { createAuth } from '../src/auth.ts';
import { registerAuthRoutes } from '../src/auth-routes.ts';
import { registerProfileRoutes } from '../src/profile-routes.ts';
import { loadGameContent } from '../src/game-content.ts';
import { CreatureLocationCode as Location } from '../src/game-save-values.ts';
import {
  databaseTest,
  fixture,
  testAuthConfig as config,
} from './helpers/game-database.mjs';

const content = await loadGameContent();
const species = content.species.find((entry) =>
  entry.learnableAttacks.some((move) => move.level === 1)
);
const gender =
  species.genderRatio === 'genderless'
    ? 'genderless'
    : species.genderRatio.female > 0
      ? 'female'
      : 'male';
const known = [
  ...new Set(
    species.learnableAttacks
      .filter((move) => move.level <= 1)
      .map((move) => move.attackId)
  ),
].slice(0, 4);
const origin = 'https://game.example.com';

function snapshot(overrides = {}) {
  const p = makeProfile({
    name: 'API save',
    creatures: [
      makePlayerCreature({
        id: randomUUID(),
        speciesId: species.id,
        gender,
        equippedAttacks: known,
      }),
    ],
    ...overrides,
  });
  const { id, ownerId, version, creatures, storageCreatures, ...profileData } =
    p;
  return { profileVersion: version, profileData, creatures, storageCreatures };
}
function draft(saved, changes = {}) {
  return {
    expectedRevision: saved.revision,
    profileVersion: saved.profileVersion,
    profileData: saved.profileData,
    creatures: saved.creatures,
    storageCreatures: saved.storageCreatures,
    ...changes,
  };
}
async function setup(t) {
  const { pool, client } = await fixture(t);
  const auth = createAuth(pool, config);
  const server = Fastify({ trustProxy: 'loopback' });
  await registerAuthRoutes(server, auth, config);
  await registerProfileRoutes(server, auth, config, pool, content);
  await server.ready();
  t.after(() => server.close());
  const login = async () => {
    const result = await server.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      headers: { origin },
      payload: {
        name: 'API test player',
        email: randomUUID() + '@example.test',
        password: 'controlled-test-password-long',
      },
    });
    assert.equal(result.statusCode, 200, result.body);
    const cookies = [result.headers['set-cookie']]
      .flat()
      .map((value) => value.split(';', 1)[0])
      .join('; ');
    return { cookie: cookies, userId: result.json().user.id };
  };
  const session = await login();
  const call = (method, url, payload, headers = {}) =>
    server.inject({
      method,
      url,
      payload,
      headers: { cookie: session.cookie, origin, ...headers },
    });
  const create = async (value = snapshot(), slot = 0) => {
    const result = await call('POST', '/api/profiles', { slot, ...value });
    assert.equal(result.statusCode, 201, result.body);
    return result.json();
  };
  return { server, pool, client, auth, login, session, call, create };
}

databaseTest(
  'profile API round-trips full saves and preserves IDs and collection order',
  async (t) => {
    const { call, create, session } = await setup(t);
    const input = snapshot({
      storageCreatures: [
        makePlayerCreature({
          id: randomUUID(),
          speciesId: species.id,
          gender,
          equippedAttacks: known,
        }),
      ],
    });
    const saved = await create(input);
    assert.equal(saved.revision, 1);
    assert.equal(saved.creatures[0].id, input.creatures[0].id);
    assert.equal(saved.creatures[0].originalOwnerId, session.userId);
    const secondCreature = saved.storageCreatures[0];
    const update = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        profileData: { ...saved.profileData, name: 'Saved manually' },
        creatures: [secondCreature],
        storageCreatures: [{ ...saved.creatures[0], xp: 5 }],
      })
    );
    assert.equal(update.statusCode, 200, update.body);
    assert.equal(update.json().revision, 2);
    assert.equal(update.json().creatures[0].id, secondCreature.id);
    assert.equal(update.json().storageCreatures[0].xp, 5);
    const loaded = await call('GET', '/api/profiles/' + saved.id);
    assert.deepEqual(loaded.json(), update.json());
    assert.equal(loaded.headers['cache-control'], 'no-store');
    const list = (await call('GET', '/api/profiles')).json();
    assert.equal(list.slots.length, content.maxProfiles);
    assert.equal(list.slots[0].name, 'Saved manually');
    assert.equal(list.slots[0].partyCount, 1);
    assert.equal(list.slots[0].storageCount, 1);
    assert.equal(list.slots[1], null);
  }
);

databaseTest(
  'every profile endpoint rejects missing, forged, expired and revoked sessions',
  async (t) => {
    const { server, call, create, client, session } = await setup(t);
    const saved = await create();
    const endpoints = [
      ['GET', '/api/profiles'],
      ['GET', '/api/profiles/' + saved.id],
      ['POST', '/api/profiles', { slot: 1, ...snapshot() }],
      ['PUT', '/api/profiles/' + saved.id, draft(saved)],
      ['DELETE', '/api/profiles/' + saved.id, { expectedRevision: 1 }],
    ];
    for (const cookie of ['', 'better-auth.session_token=forged']) {
      for (const [method, url, payload] of endpoints)
        assert.equal(
          (
            await server.inject({
              method,
              url,
              payload,
              headers: { origin, cookie },
            })
          ).statusCode,
          401
        );
    }
    await client.query(
      'UPDATE "session" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL \'1 day\' WHERE "userId" = $1',
      [session.userId]
    );
    assert.equal((await call('GET', '/api/profiles')).statusCode, 401);
  }
);

databaseTest(
  'logout immediately revokes save access and session renewal forwards cookies',
  async (t) => {
    const { call, client, session, server } = await setup(t);
    await client.query(
      'UPDATE "session" SET "expiresAt" = CURRENT_TIMESTAMP + INTERVAL \'5 minutes\' WHERE "userId" = $1',
      [session.userId]
    );
    const refreshed = await call('GET', '/api/profiles');
    assert.equal(refreshed.statusCode, 200, refreshed.body);
    assert.ok(refreshed.headers['set-cookie']);
    await server.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie: session.cookie, origin },
      payload: {},
    });
    assert.equal((await call('GET', '/api/profiles')).statusCode, 401);
  }
);

databaseTest(
  'write origin checks and CORS protect authenticated requests',
  async (t) => {
    const { server, call, session } = await setup(t);
    for (const suppliedOrigin of [
      undefined,
      'null',
      'https://attacker.example',
    ]) {
      const headers = { cookie: session.cookie };
      if (suppliedOrigin !== undefined) headers.origin = suppliedOrigin;
      const result = await server.inject({
        method: 'POST',
        url: '/api/profiles',
        payload: { slot: 0, ...snapshot() },
        headers,
      });
      assert.equal(result.statusCode, 403);
    }
    const preflight = await server.inject({
      method: 'OPTIONS',
      url: '/api/profiles/' + randomUUID(),
      headers: {
        origin,
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type',
      },
    });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], origin);
    assert.equal(preflight.headers['access-control-allow-credentials'], 'true');
    assert.match(preflight.headers['access-control-allow-methods'], /PUT/);
    assert.match(preflight.headers['access-control-allow-methods'], /DELETE/);
    assert.deepEqual(
      (await call('GET', '/api/profiles')).json().slots,
      Array(content.maxProfiles).fill(null)
    );
  }
);

databaseTest(
  'another account cannot list, read, overwrite or delete a profile',
  async (t) => {
    const { call, create, login } = await setup(t);
    const saved = await create();
    const other = await login();
    const headers = { cookie: other.cookie };
    assert.deepEqual(
      (await call('GET', '/api/profiles', undefined, headers)).json().slots,
      Array(content.maxProfiles).fill(null)
    );
    for (const [method, payload] of [
      ['GET', undefined],
      ['PUT', draft(saved)],
      ['DELETE', { expectedRevision: 1 }],
    ]) {
      const result = await call(
        method,
        '/api/profiles/' + saved.id,
        payload,
        headers
      );
      assert.equal(result.statusCode, 404);
      assert.equal(result.json().latest, undefined);
    }
    assert.equal(
      (await call('GET', '/api/profiles/' + saved.id)).json().revision,
      1
    );
  }
);

databaseTest(
  'concurrent manual saves accept one revision and return the complete winning save to the loser',
  async (t) => {
    const { create, call } = await setup(t);
    const saved = await create();
    const responses = await Promise.all(
      ['Device A', 'Device B'].map((name) =>
        call(
          'PUT',
          '/api/profiles/' + saved.id,
          draft(saved, { profileData: { ...saved.profileData, name } })
        )
      )
    );
    assert.deepEqual(responses.map((r) => r.statusCode).sort(), [200, 409]);
    const winner = responses.find((r) => r.statusCode === 200).json();
    const loser = responses.find((r) => r.statusCode === 409).json();
    assert.equal(loser.code, 'STALE_PROFILE');
    assert.deepEqual(loser.latest, winner);
    assert.equal(winner.revision, 2);
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      winner
    );
    assert.equal(
      (
        await call('DELETE', '/api/profiles/' + saved.id, {
          expectedRevision: 1,
        })
      ).statusCode,
      409
    );
  }
);

databaseTest(
  'occupied slots and recreated saves cannot be overwritten by an old client',
  async (t) => {
    const { create, call } = await setup(t);
    const saved = await create();
    const duplicate = await call('POST', '/api/profiles', {
      slot: saved.slot,
      ...snapshot(),
    });
    assert.equal(duplicate.statusCode, 409);
    assert.equal(duplicate.json().code, 'SLOT_OCCUPIED');
    assert.equal(
      (
        await call('DELETE', '/api/profiles/' + saved.id, {
          expectedRevision: saved.revision,
        })
      ).statusCode,
      204
    );
    const replacement = await create();
    assert.notEqual(replacement.id, saved.id);
    assert.equal(
      (await call('PUT', '/api/profiles/' + saved.id, draft(saved))).statusCode,
      404
    );
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + replacement.id)).json(),
      replacement
    );
  }
);

databaseTest(
  'save validation rejects malformed snapshots without changing the stored revision',
  async (t) => {
    const { create, call } = await setup(t);
    const saved = await create();
    const mutations = [
      (body) => {
        body.accountId = randomUUID();
      },
      (body) => {
        body.profileVersion = -1;
      },
      (body) => {
        body.profileData.creatures = [];
      },
      (body) => {
        body.profileData.storyProgression = -1;
      },
      (body) => {
        body.profileData.inventory = [{ id: 'bad' }];
      },
      (body) => {
        body.creatures[0].speciesId = -1;
      },
      (body) => {
        body.creatures[0].equippedAttacks = [-1];
      },
      (body) => {
        body.creatures[0].equippedAttacks = [known[0], known[0]];
      },
      (body) => {
        body.creatures[0].activeAttackIndex = -1;
      },
      (body) => {
        body.creatures[0].targetingMode = 'invented';
      },
      (body) => {
        body.creatures[0].gender =
          gender === 'genderless' ? 'female' : 'genderless';
      },
      (body) => {
        body.creatures[0].originalOwnerId = 'forged';
      },
      (body) => {
        body.creatures[0].isShiny = !body.creatures[0].isShiny;
      },
      (body) => {
        body.storageCreatures.push(body.creatures[0]);
      },
      (body) => {
        body.expectedRevision = '1';
      },
    ];
    for (const mutate of mutations) {
      const body = structuredClone(draft(saved));
      mutate(body);
      const result = await call('PUT', '/api/profiles/' + saved.id, body);
      assert.equal(result.statusCode, 400, result.body);
    }
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      saved
    );
  }
);

databaseTest(
  'a snapshot cannot reclaim a boxed creature or another profile creature, and failures roll back all edits',
  async (t) => {
    const { create, call, client, session } = await setup(t);
    const first = await create();
    const second = await create(snapshot(), 1);
    const boxed = second.creatures[0];
    const otherProfile = await call(
      'PUT',
      '/api/profiles/' + first.id,
      draft(first, { storageCreatures: [boxed] })
    );
    assert.equal(otherProfile.statusCode, 409);
    await client.query(
      'UPDATE player_creatures SET profile_id = NULL, location = $1 WHERE id = $2',
      [Location.TRADE_BOX, boxed.id]
    );
    const conflict = await call(
      'PUT',
      '/api/profiles/' + first.id,
      draft(first, {
        profileData: { ...first.profileData, name: 'Must roll back' },
        storageCreatures: [boxed],
      })
    );
    assert.equal(conflict.statusCode, 409, conflict.body);
    assert.equal(conflict.json().code, 'CREATURE_CONFLICT');
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + first.id)).json(),
      first
    );
    const owner = (
      await client.query(
        'SELECT owner_account_id, profile_id FROM player_creatures WHERE id = $1',
        [boxed.id]
      )
    ).rows[0];
    assert.equal(owner.owner_account_id, session.userId);
    assert.equal(owner.profile_id, null);
    const dropped = await call(
      'PUT',
      '/api/profiles/' + first.id,
      draft(first, { creatures: [] })
    );
    assert.equal(dropped.statusCode, 409);
  }
);

databaseTest(
  'a database failure after creature writes rolls back the whole save and allows retry',
  async (t) => {
    const { create, call, client } = await setup(t);
    const saved = await create();
    await client.query(
      `CREATE FUNCTION reject_test_profile_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled failure'; END $$`
    );
    await client.query(
      'CREATE TRIGGER reject_test_profile_update BEFORE UPDATE ON game_profiles FOR EACH ROW EXECUTE FUNCTION reject_test_profile_update()'
    );
    const changed = draft(saved, {
      creatures: [{ ...saved.creatures[0], xp: 10 }],
    });
    const failed = await call('PUT', '/api/profiles/' + saved.id, changed);
    assert.equal(failed.statusCode, 503, failed.body);
    assert.equal(failed.json().code, 'SAVE_UNAVAILABLE');
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      saved
    );
    await client.query(
      'DROP TRIGGER reject_test_profile_update ON game_profiles'
    );
    assert.equal(
      (await call('PUT', '/api/profiles/' + saved.id, changed)).statusCode,
      200
    );
  }
);

databaseTest(
  'the profile API works over HTTP with a real session and PostgreSQL',
  async (t) => {
    const { server, session } = await setup(t);
    const base = await server.listen({ host: '127.0.0.1', port: 0 });
    const headers = {
      cookie: session.cookie,
      origin,
      'content-type': 'application/json',
    };
    const created = await fetch(base + '/api/profiles', {
      method: 'POST',
      headers,
      body: JSON.stringify({ slot: 0, ...snapshot() }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.headers.get('access-control-allow-origin'), origin);
    const saved = await created.json();
    const updated = await fetch(base + '/api/profiles/' + saved.id, {
      method: 'PUT',
      headers,
      body: JSON.stringify(draft(saved)),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).revision, 2);
  }
);

databaseTest(
  'racing accounts cannot duplicate a new creature ID and the rejected creation leaves its slot empty',
  async (t) => {
    const { call, login, client } = await setup(t);
    const other = await login();
    const input = snapshot();
    const responses = await Promise.all([
      call('POST', '/api/profiles', { slot: 0, ...input }),
      call(
        'POST',
        '/api/profiles',
        { slot: 0, ...input },
        { cookie: other.cookie }
      ),
    ]);
    assert.deepEqual(
      responses.map((result) => result.statusCode).sort(),
      [201, 409]
    );
    const winner = responses.find((result) => result.statusCode === 201).json();
    const rows = (
      await client.query(
        'SELECT owner_account_id, original_owner_id, profile_id FROM player_creatures WHERE id = $1',
        [input.creatures[0].id]
      )
    ).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].profile_id, winner.id);
    assert.equal(rows[0].owner_account_id, rows[0].original_owner_id);
    assert.equal(
      (await client.query('SELECT count(*)::int AS count FROM game_profiles'))
        .rows[0].count,
      1
    );
  }
);

databaseTest(
  'malformed IDs and oversized saves fail safely without changing slots',
  async (t) => {
    const { call } = await setup(t);
    assert.equal(
      (await call('GET', '/api/profiles/not-a-uuid')).statusCode,
      400
    );
    const input = snapshot();
    input.profileData.name = 'x'.repeat(1024 * 1024);
    assert.equal(
      (await call('POST', '/api/profiles', { slot: 0, ...input })).statusCode,
      413
    );
    assert.deepEqual(
      (await call('GET', '/api/profiles')).json().slots,
      Array(content.maxProfiles).fill(null)
    );
  }
);
