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

function creatureInput({ originalOwnerId, ...fields }) {
  return fields;
}
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
  return {
    profileVersion: version,
    profileData,
    creatures: creatures.map(creatureInput),
    storageCreatures: storageCreatures.map(creatureInput),
  };
}
function draft(saved, changes = {}) {
  const creatureChanges = changes.creatureChanges ?? { added: [], updated: [] };
  const order = creatureChanges.order;
  // Concise one-box fixtures; explicit multi-box tests pass box records directly.
  const normalized = order?.storage?.every((id) => typeof id === 'string')
    ? {
        ...creatureChanges,
        order: {
          ...order,
          storage: [{ ...saved.storageBoxes[0], creatureIds: order.storage }],
        },
      }
    : creatureChanges;
  return {
    expectedRevision: saved.revision,
    profileVersion: saved.profileVersion,
    ...changes,
    creatureChanges: normalized,
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
  'profile API saves only changed records and returns compact metadata',
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
        creatureChanges: {
          added: [],
          updated: [{ ...creatureInput(saved.creatures[0]), xp: 5 }],
          order: {
            party: [secondCreature.id],
            storage: [saved.creatures[0].id],
          },
        },
      })
    );
    assert.equal(update.statusCode, 200, update.body);
    assert.equal(update.json().revision, 2);
    assert.equal(update.json().creatures, undefined);
    assert.equal(update.json().profileData, undefined);
    const loaded = await call('GET', '/api/profiles/' + saved.id);
    assert.equal(loaded.json().creatures[0].id, secondCreature.id);
    assert.equal(loaded.json().storageCreatures[0].xp, 5);
    assert.equal(loaded.json().revision, update.json().revision);
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
    const latest = (await call('GET', '/api/profiles/' + saved.id)).json();
    assert.deepEqual(loser.latest, latest);
    assert.equal(winner.revision, 2);
    assert.equal(latest.revision, winner.revision);
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
        body.creatureChanges.updated[0].speciesId = -1;
      },
      (body) => {
        body.creatureChanges.updated[0].equippedAttacks = [-1];
      },
      (body) => {
        body.creatureChanges.updated[0].equippedAttacks = [known[0], known[0]];
      },
      (body) => {
        body.creatureChanges.updated[0].activeAttackIndex = -1;
      },
      (body) => {
        body.creatureChanges.updated[0].targetingMode = 'invented';
      },
      (body) => {
        body.creatureChanges.updated[0].gender =
          gender === 'genderless' ? 'female' : 'genderless';
      },
      (body) => {
        body.creatureChanges.updated[0].originalOwnerId = 'forged';
      },
      (body) => {
        body.creatureChanges.updated[0].isShiny =
          !body.creatureChanges.updated[0].isShiny;
      },
      (body) => {
        body.creatureChanges.added.push(body.creatureChanges.updated[0]);
      },
      (body) => {
        body.expectedRevision = '1';
      },
    ];
    for (const mutate of mutations) {
      const body = structuredClone(
        draft(saved, {
          profileData: saved.profileData,
          creatureChanges: {
            added: [],
            updated: [creatureInput(saved.creatures[0])],
          },
        })
      );
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
      draft(first, {
        creatureChanges: {
          added: [creatureInput(boxed)],
          updated: [],
          order: {
            party: first.creatures.map((c) => c.id),
            storage: [boxed.id],
          },
        },
      })
    );
    assert.equal(otherProfile.statusCode, 409);
    await client.query(
      'UPDATE player_creatures SET profile_id = NULL, location = $1, storage_box_id = NULL, position = 0 WHERE id = $2',
      [Location.TRADE_BOX, boxed.id]
    );
    const conflict = await call(
      'PUT',
      '/api/profiles/' + first.id,
      draft(first, {
        profileData: { ...first.profileData, name: 'Must roll back' },
        creatureChanges: {
          added: [creatureInput(boxed)],
          updated: [],
          order: {
            party: first.creatures.map((c) => c.id),
            storage: [boxed.id],
          },
        },
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
      draft(first, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { party: [], storage: [] },
        },
      })
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
      creatureChanges: {
        added: [],
        updated: [{ ...creatureInput(saved.creatures[0]), xp: 10 }],
        order: {
          storage: [{ ...saved.storageBoxes[0], name: 'Must roll back' }],
        },
      },
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
  'omitted creatures are untouched and established original ownership survives updates',
  async (t) => {
    const { create, call, client } = await setup(t);
    const saved = await create(
      snapshot({
        storageCreatures: [
          makePlayerCreature({
            id: randomUUID(),
            speciesId: species.id,
            gender,
            equippedAttacks: known,
          }),
        ],
      })
    );
    const storageId = saved.storageCreatures[0].id;
    await client.query(
      'UPDATE player_creatures SET original_owner_id = $1 WHERE id = $2',
      ['historical-owner', saved.creatures[0].id]
    );
    const before = (
      await client.query('SELECT * FROM player_creatures WHERE id = $1', [
        storageId,
      ])
    ).rows[0];
    const update = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [{ ...creatureInput(saved.creatures[0]), xp: 37 }],
        },
      })
    );
    assert.equal(update.statusCode, 200, update.body);
    assert.deepEqual(
      (
        await client.query('SELECT * FROM player_creatures WHERE id = $1', [
          storageId,
        ])
      ).rows[0],
      before
    );
    const loaded = (await call('GET', '/api/profiles/' + saved.id)).json();
    assert.equal(loaded.creatures[0].xp, 37);
    assert.equal(loaded.creatures[0].originalOwnerId, 'historical-owner');
    assert.deepEqual(loaded.profileData, saved.profileData);
    assert.deepEqual(loaded.storageCreatures, saved.storageCreatures);
  }
);

databaseTest(
  'new IDs require explicit additions, receive server ownership, and cannot overwrite existing rows',
  async (t) => {
    const { create, call, session, client } = await setup(t);
    const saved = await create();
    const fresh = creatureInput(
      makePlayerCreature({
        id: randomUUID(),
        speciesId: species.id,
        gender,
        equippedAttacks: known,
      })
    );
    const wrongUpdate = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: { added: [], updated: [fresh] },
      })
    );
    assert.equal(wrongUpdate.statusCode, 409, wrongUpdate.body);
    const wrongAdd = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [creatureInput(saved.creatures[0])],
          updated: [],
          order: { party: [saved.creatures[0].id], storage: [] },
        },
      })
    );
    assert.equal(wrongAdd.statusCode, 409, wrongAdd.body);
    const result = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [fresh],
          updated: [],
          order: { party: [saved.creatures[0].id], storage: [fresh.id] },
        },
      })
    );
    assert.equal(result.statusCode, 200, result.body);
    const loaded = (await call('GET', '/api/profiles/' + saved.id)).json();
    assert.equal(loaded.storageCreatures[0].id, fresh.id);
    assert.equal(loaded.storageCreatures[0].originalOwnerId, session.userId);
    assert.equal(
      (
        await client.query(
          'SELECT owner_account_id FROM player_creatures WHERE id = $1',
          [fresh.id]
        )
      ).rows[0].owner_account_id,
      session.userId
    );
  }
);

databaseTest(
  'ownership fields are rejected on creation and update, including in nested creature changes',
  async (t) => {
    const { create, call } = await setup(t);
    const saved = await create();
    for (const field of ['ownerId', 'originalOwnerId', 'owner_account_id']) {
      const input = snapshot();
      input.creatures[0][field] = 'forged';
      assert.equal(
        (await call('POST', '/api/profiles', { slot: 1, ...input })).statusCode,
        400
      );
      const result = await call(
        'PUT',
        '/api/profiles/' + saved.id,
        draft(saved, {
          creatureChanges: {
            added: [],
            updated: [
              { ...creatureInput(saved.creatures[0]), [field]: 'forged' },
            ],
          },
        })
      );
      assert.equal(result.statusCode, 400, result.body);
    }
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      saved
    );
  }
);

databaseTest(
  'reorder-only saves preserve records and reject missing, duplicate or foreign IDs atomically',
  async (t) => {
    const { create, call, client } = await setup(t);
    const saved = await create(
      snapshot({
        storageCreatures: [
          makePlayerCreature({
            id: randomUUID(),
            speciesId: species.id,
            gender,
            equippedAttacks: known,
          }),
        ],
      })
    );
    const party = saved.creatures[0].id,
      storage = saved.storageCreatures[0].id;
    for (const order of [
      { party: [], storage: [] },
      { party: [party], storage: [party] },
      { party: [party], storage: [randomUUID()] },
    ]) {
      const result = await call(
        'PUT',
        '/api/profiles/' + saved.id,
        draft(saved, {
          profileData: { ...saved.profileData, name: 'Must roll back' },
          creatureChanges: { added: [], updated: [], order },
        })
      );
      assert.ok([400, 409].includes(result.statusCode), result.body);
      assert.deepEqual(
        (await call('GET', '/api/profiles/' + saved.id)).json(),
        saved
      );
    }
    const before = (
      await client.query(
        'SELECT id, xp, original_owner_id FROM player_creatures ORDER BY id'
      )
    ).rows;
    const moved = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { party: [storage], storage: [party] },
        },
      })
    );
    assert.equal(moved.statusCode, 200, moved.body);
    assert.deepEqual(
      (
        await client.query(
          'SELECT id, xp, original_owner_id FROM player_creatures ORDER BY id'
        )
      ).rows,
      before
    );
    const loaded = (await call('GET', '/api/profiles/' + saved.id)).json();
    assert.equal(loaded.creatures[0].id, storage);
    assert.equal(loaded.storageCreatures[0].id, party);
  }
);

databaseTest(
  'malformed change sets and legacy snapshot updates are rejected without writes',
  async (t) => {
    const { create, call } = await setup(t);
    const saved = await create();
    const fresh = creatureInput(
      makePlayerCreature({
        id: randomUUID(),
        speciesId: species.id,
        gender,
        equippedAttacks: known,
      })
    );
    for (const changes of [
      { creatures: [], storageCreatures: [] },
      {
        creatureChanges: {
          added: [],
          updated: [],
          remove: [saved.creatures[0].id],
        },
      },
      { creatureChanges: { added: [fresh], updated: [] } },
      {
        creatureChanges: {
          added: [fresh],
          updated: [],
          order: { party: [saved.creatures[0].id], storage: [] },
        },
      },
      {
        creatureChanges: {
          added: [],
          updated: [
            creatureInput(saved.creatures[0]),
            creatureInput(saved.creatures[0]),
          ],
        },
      },
      {
        creatureChanges: {
          added: [],
          updated: [],
          order: { party: null },
        },
      },
      {
        creatureChanges: {
          added: [],
          updated: [],
          order: {
            party: [saved.creatures[0].id],
            storage: [],
            ownerId: 'forged',
          },
        },
      },
    ]) {
      const result = await call(
        'PUT',
        '/api/profiles/' + saved.id,
        draft(saved, changes)
      );
      assert.equal(result.statusCode, 400, result.body);
    }
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      saved
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
  'individual box edits and rearrangements never rewrite creature rows or other boxes',
  async (t) => {
    const { create, call, client } = await setup(t);
    let saved = await create(
      snapshot({
        storageCreatures: [
          makePlayerCreature({
            id: randomUUID(),
            speciesId: species.id,
            gender,
            equippedAttacks: known,
          }),
          makePlayerCreature({
            id: randomUUID(),
            speciesId: species.id,
            gender,
            equippedAttacks: known,
          }),
        ],
      })
    );
    const newBox = {
      id: randomUUID(),
      name: 'Training',
      position: 1,
      creatureIds: [],
    };
    const added = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { storage: [newBox] },
        },
      })
    );
    assert.equal(added.statusCode, 200, added.body);
    saved = (await call('GET', '/api/profiles/' + saved.id)).json();
    const before = (
      await client.query('SELECT * FROM player_creatures ORDER BY id')
    ).rows;
    const otherBefore = (
      await client.query('SELECT * FROM profile_storage_boxes WHERE id = $1', [
        newBox.id,
      ])
    ).rows[0];
    const rearranged = {
      ...saved.storageBoxes[0],
      creatureIds: [...saved.storageBoxes[0].creatureIds].reverse(),
    };
    const result = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { storage: [rearranged] },
        },
      })
    );
    assert.equal(result.statusCode, 200, result.body);
    assert.deepEqual(
      (await client.query('SELECT * FROM player_creatures ORDER BY id')).rows,
      before
    );
    assert.deepEqual(
      (
        await client.query(
          'SELECT * FROM profile_storage_boxes WHERE id = $1',
          [newBox.id]
        )
      ).rows[0],
      otherBefore
    );
    const loaded = (await call('GET', '/api/profiles/' + saved.id)).json();
    assert.deepEqual(
      loaded.storageCreatures.map((c) => c.id),
      rearranged.creatureIds
    );
    assert.deepEqual(loaded.creatures, saved.creatures);
    assert.equal(loaded.storageBoxes[1].name, 'Training');
  }
);

databaseTest(
  'cross-box moves require both order lists and change only the moved creature assignment',
  async (t) => {
    const { create, call, client } = await setup(t);
    const saved = await create(
      snapshot({
        storageCreatures: [
          makePlayerCreature({
            id: randomUUID(),
            speciesId: species.id,
            gender,
            equippedAttacks: known,
          }),
        ],
      })
    );
    const source = saved.storageBoxes[0];
    const destination = {
      id: randomUUID(),
      name: 'Destination',
      position: 1,
      creatureIds: [...source.creatureIds],
    };
    const wrong = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { storage: [destination] },
        },
      })
    );
    assert.equal(wrong.statusCode, 409, wrong.body);
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + saved.id)).json(),
      saved
    );
    const partyBefore = (
      await client.query('SELECT * FROM player_creatures WHERE id = $1', [
        saved.creatures[0].id,
      ])
    ).rows[0];
    const result = await call(
      'PUT',
      '/api/profiles/' + saved.id,
      draft(saved, {
        creatureChanges: {
          added: [],
          updated: [],
          order: { storage: [{ ...source, creatureIds: [] }, destination] },
        },
      })
    );
    assert.equal(result.statusCode, 200, result.body);
    const stored = (
      await client.query('SELECT * FROM player_creatures WHERE id = $1', [
        source.creatureIds[0],
      ])
    ).rows[0];
    assert.equal(stored.storage_box_id, destination.id);
    assert.equal(stored.position, null);
    assert.equal(
      stored.original_owner_id,
      saved.storageCreatures[0].originalOwnerId
    );
    assert.deepEqual(
      (
        await client.query('SELECT * FROM player_creatures WHERE id = $1', [
          saved.creatures[0].id,
        ])
      ).rows[0],
      partyBefore
    );
  }
);

databaseTest(
  'box IDs from another profile cannot be adopted or edited',
  async (t) => {
    const { create, call } = await setup(t);
    const first = await create();
    const second = await create(snapshot(), 1);
    const result = await call(
      'PUT',
      '/api/profiles/' + first.id,
      draft(first, {
        creatureChanges: {
          added: [],
          updated: [],
          order: {
            storage: [
              { ...second.storageBoxes[0], position: 1, name: 'Stolen' },
            ],
          },
        },
      })
    );
    assert.equal(result.statusCode, 409, result.body);
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + first.id)).json(),
      first
    );
    assert.deepEqual(
      (await call('GET', '/api/profiles/' + second.id)).json(),
      second
    );
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
