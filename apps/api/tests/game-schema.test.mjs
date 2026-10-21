import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { getMigrations } from 'better-auth/db/migration';
import { createAuthOptions } from '../src/auth.ts';
import {
  databaseTest,
  fixture,
  testAuthConfig as config,
} from './helpers/game-database.mjs';
import {
  applyGameMigrations,
  planGameMigrations,
} from '../src/game-migrations.ts';
import {
  CreatureGenderCode as Gender,
  CreatureLocationCode as Location,
} from '../src/game-save-values.ts';

async function account(client, id = randomUUID()) {
  await client.query(
    `
    INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    VALUES ($1, 'Controlled account', $2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `,
    [id, id + '@example.test']
  );
  return id;
}

async function profile(client, owner, slot = 0) {
  // Deliberately minimal JSON tests the database boundary, not API validation.
  return (
    await client.query(
      `
    INSERT INTO game_profiles (account_id, slot, profile_version, profile_data)
    VALUES ($1, $2, 1, $3) RETURNING *
  `,
      [owner, slot, { name: 'Controlled profile' }]
    )
  ).rows[0];
}

async function box(client, owner) {
  await client.query(
    'INSERT INTO account_trade_boxes (account_id) VALUES ($1)',
    [owner]
  );
}

async function creature(client, owner, save = null, overrides = {}) {
  const values = {
    id: randomUUID(),
    originalOwner: owner,
    location: save ? Location.PARTY : Location.TRADE_BOX,
    position: 0,
    gender: Gender.GENDERLESS,
    attacks: [801, 802],
    active: 0,
    ...overrides,
  };
  return (
    await client.query(
      `
    INSERT INTO player_creatures (
      id, owner_account_id, original_owner_id, profile_id, location, position,
      species_id, gender, level, xp, equipped_attack_ids, active_attack_index
    ) VALUES ($1, $2, $3, $4, $5, $6, 901, $7, 1, 0, $8, $9)
    RETURNING *
  `,
      [
        values.id,
        owner,
        values.originalOwner,
        save?.id ?? null,
        values.location,
        values.position,
        values.gender,
        values.attacks,
        values.active,
      ]
    )
  ).rows[0];
}

const rejectsCode = (promise, code) =>
  assert.rejects(promise, (error) => error.code === code);

test('database gender and location assignments remain permanent', () => {
  assert.deepEqual(Gender, { GENDERLESS: 0, MALE: 1, FEMALE: 2 });
  assert.deepEqual(Location, { PARTY: 0, STORAGE: 1, TRADE_BOX: 2 });
});

databaseTest(
  'preview leaves no changes and applying again preserves existing saves',
  async (t) => {
    const { client } = await fixture(t, { migrate: false });
    const preview = [];
    assert.equal(
      (await planGameMigrations(client, (sql) => preview.push(sql))).length,
      1
    );
    assert.match(preview.join('\n'), /CREATE TABLE game_profiles/);
    assert.equal(
      (
        await client.query(
          "SELECT to_regclass('game_schema_migrations') AS ledger"
        )
      ).rows[0].ledger,
      null
    );
    assert.equal(
      (await client.query("SELECT to_regclass('game_profiles') AS name"))
        .rows[0].name,
      null
    );
    assert.equal((await applyGameMigrations(client)).length, 1);
    const owner = await account(client);
    const save = await profile(client, owner);
    const owned = await creature(client, owner, save);
    assert.deepEqual(await planGameMigrations(client), []);
    assert.deepEqual(await applyGameMigrations(client), []);
    assert.equal(
      (await client.query('SELECT id FROM player_creatures')).rows[0].id,
      owned.id
    );
  }
);

databaseTest(
  'missing auth schema rolls back all game migration changes',
  async (t) => {
    const { client, pool } = await fixture(t, { auth: false, migrate: false });
    await rejectsCode(applyGameMigrations(client), '42P01');
    for (const name of [
      'game_profiles',
      'account_trade_boxes',
      'player_creatures',
    ]) {
      assert.equal(
        (await client.query('SELECT to_regclass($1) AS name', [name])).rows[0]
          .name,
        null
      );
    }
    assert.deepEqual(
      (await client.query('SELECT * FROM game_schema_migrations')).rows,
      []
    );
    await (
      await getMigrations(createAuthOptions(pool, config))
    ).runMigrations();
    assert.equal((await applyGameMigrations(client)).length, 1);
  }
);

databaseTest(
  'a failed preview rolls back setup and leaves the connection usable',
  async (t) => {
    const { client } = await fixture(t, { migrate: false });
    await client.query(
      'CREATE TABLE game_schema_migrations (id INTEGER PRIMARY KEY, marker TEXT)'
    );
    await client.query(
      "INSERT INTO game_schema_migrations VALUES (1, 'existing history')"
    );
    await rejectsCode(planGameMigrations(client), '42703');
    assert.deepEqual(
      (await client.query('SELECT marker FROM game_schema_migrations')).rows,
      [{ marker: 'existing history' }]
    );
    assert.equal(
      (await client.query("SELECT to_regclass('game_profiles') AS name"))
        .rows[0].name,
      null
    );
    await client.query('DROP TABLE game_schema_migrations');
    assert.equal((await applyGameMigrations(client)).length, 1);
  }
);

databaseTest(
  'concurrent migrations apply the schema exactly once',
  async (t) => {
    const { client, pool } = await fixture(t, { migrate: false });
    const second = await pool.connect();
    try {
      const results = await Promise.all([
        applyGameMigrations(client),
        applyGameMigrations(second),
      ]);
      assert.deepEqual(results.map((ids) => ids.length).sort(), [0, 1]);
    } finally {
      second.release();
    }
  }
);

databaseTest(
  'a late migration failure rolls back tables and history entries without touching the conflicting table',
  async (t) => {
    const { client } = await fixture(t, { migrate: false });
    await client.query('CREATE TABLE player_creatures (marker TEXT)');
    await client.query("INSERT INTO player_creatures VALUES ('existing data')");
    await rejectsCode(applyGameMigrations(client), '42P07');
    for (const name of ['game_profiles', 'account_trade_boxes']) {
      assert.equal(
        (await client.query('SELECT to_regclass($1) AS name', [name])).rows[0]
          .name,
        null
      );
    }
    assert.deepEqual(
      (await client.query('SELECT * FROM game_schema_migrations')).rows,
      []
    );
    assert.deepEqual(
      (await client.query('SELECT marker FROM player_creatures')).rows,
      [{ marker: 'existing data' }]
    );
  }
);

databaseTest(
  'migration order checks reject mismatched history without changing saves',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const save = await profile(client, owner);
    const owned = await creature(client, owner, save);
    await client.query(
      "UPDATE game_schema_migrations SET name = '999_future_migration'"
    );
    await assert.rejects(
      applyGameMigrations(client),
      /preceding already run migration/
    );
    await assert.rejects(
      planGameMigrations(client),
      /preceding already run migration/
    );
    assert.equal(
      (await client.query('SELECT id FROM player_creatures')).rows[0].id,
      owned.id
    );
  }
);

databaseTest(
  'each account has three independent slots and one trade-box record',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const other = await account(client);
    for (const slot of [0, 1, 2]) await profile(client, owner, slot);
    await profile(client, other, 0);
    await rejectsCode(profile(client, owner, 0), '23505');
    for (const slot of [-1, 3])
      await rejectsCode(profile(client, owner, slot), '23514');
    await rejectsCode(profile(client, 'missing-account'), '23503');
    await box(client, owner);
    await rejectsCode(box(client, owner), '23505');
    await rejectsCode(box(client, 'missing-account'), '23503');
  }
);

databaseTest(
  'profile JSON excludes duplicated ownership, identities and creatures',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const save = await profile(client, owner);
    for (const value of [
      null,
      [],
      'string',
      1,
      ...['id', 'ownerId', 'version', 'creatures', 'storageCreatures'].map(
        (key) => ({ [key]: [] })
      ),
    ]) {
      await rejectsCode(
        client.query(
          'UPDATE game_profiles SET profile_data = $1::jsonb WHERE id = $2',
          [JSON.stringify(value), save.id]
        ),
        '23514'
      );
    }
    for (const column of ['revision', 'profile_version']) {
      await rejectsCode(
        client.query(`UPDATE game_profiles SET ${column} = 0 WHERE id = $1`, [
          save.id,
        ]),
        '23514'
      );
    }
    await box(client, owner);
    await rejectsCode(
      client.query(
        'UPDATE account_trade_boxes SET revision = 0 WHERE account_id = $1',
        [owner]
      ),
      '23514'
    );
  }
);

databaseTest(
  'creatures can only reference profiles belonging to their current owner',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const other = await account(client);
    const save = await profile(client, owner);
    await rejectsCode(creature(client, other, save), '23503');
    await rejectsCode(creature(client, 'missing-owner'), '23503');
    for (const location of [Location.PARTY, Location.STORAGE]) {
      await rejectsCode(creature(client, owner, null, { location }), '23514');
    }
    await rejectsCode(
      creature(client, owner, save, { location: Location.TRADE_BOX }),
      '23514'
    );
  }
);

databaseTest(
  'party, storage and trade-box positions are exclusive in their own collections',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const other = await account(client);
    const save = await profile(client, owner);
    const second = await profile(client, owner, 1);
    await box(client, owner);
    await box(client, other);
    for (let position = 0; position < 6; position++)
      await creature(client, owner, save, { position });
    await rejectsCode(creature(client, owner, save), '23505');
    await rejectsCode(creature(client, owner, save, { position: 6 }), '23514');
    await creature(client, owner, second);
    await creature(client, owner, save, { location: Location.STORAGE });
    await creature(client, owner);
    await creature(client, other);
    await rejectsCode(creature(client, owner), '23505');
    await rejectsCode(creature(client, owner, null, { position: -1 }), '23514');
  }
);

databaseTest(
  'position checks can be deferred for a swap but reject final duplicates',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const save = await profile(client, owner);
    const first = await creature(client, owner, save);
    const second = await creature(client, owner, save, { position: 1 });
    await client.query('BEGIN');
    await client.query(
      'SET CONSTRAINTS player_creatures_position_unique DEFERRED'
    );
    await client.query(
      'UPDATE player_creatures SET position = 1 WHERE id = $1',
      [first.id]
    );
    await client.query(
      'UPDATE player_creatures SET position = 0 WHERE id = $1',
      [second.id]
    );
    await client.query('COMMIT');
    assert.equal(
      (
        await client.query(
          'SELECT position FROM player_creatures WHERE id = $1',
          [first.id]
        )
      ).rows[0].position,
      1
    );
    await client.query('BEGIN');
    await client.query(
      'SET CONSTRAINTS player_creatures_position_unique DEFERRED'
    );
    await client.query(
      'UPDATE player_creatures SET position = 0 WHERE id = $1',
      [first.id]
    );
    await rejectsCode(client.query('COMMIT'), '23505');
  }
);

databaseTest(
  'gender and location use small integers and reject unknown values',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    for (const gender of Object.values(Gender))
      await creature(client, owner, null, { gender, position: gender });
    const types = (
      await client.query(
        'SELECT pg_typeof(gender)::text AS gender, pg_typeof(location)::text AS location FROM player_creatures LIMIT 1'
      )
    ).rows[0];
    assert.deepEqual(types, { gender: 'smallint', location: 'smallint' });
    for (const gender of [-1, 3])
      await rejectsCode(
        creature(client, owner, null, { gender, position: 10 }),
        '23514'
      );
    for (const location of [-1, 3])
      await rejectsCode(
        creature(client, owner, null, { location, position: 10 }),
        '23514'
      );
  }
);

databaseTest(
  'attack arrays and selected indices reject malformed stored values',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    for (const attacks of [
      [],
      [0],
      [-1],
      [801, null],
      [801, 802, 803, 804, 805],
      [
        [801, 802],
        [803, 804],
      ],
    ]) {
      await rejectsCode(creature(client, owner, null, { attacks }), '23514');
    }
    for (const active of [-1, 2])
      await rejectsCode(creature(client, owner, null, { active }), '23514');
    const owned = await creature(client, owner);
    await rejectsCode(
      client.query(
        "UPDATE player_creatures SET equipped_attack_ids = '[0:1]={801,802}'::integer[] WHERE id = $1",
        [owned.id]
      ),
      '23514'
    );
  }
);

databaseTest(
  'creature origins and progression reject invalid boundary values',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    for (const originalOwner of ['', '   ', 'guest', ' guest ']) {
      await rejectsCode(
        creature(client, owner, null, { originalOwner }),
        '23514'
      );
    }
    const owned = await creature(client, owner);
    for (const [column, value] of [
      ['species_id', 0],
      ['level', 0],
      ['xp', -1],
    ]) {
      await rejectsCode(
        client.query(
          `UPDATE player_creatures SET ${column} = $1 WHERE id = $2`,
          [value, owned.id]
        ),
        '23514'
      );
    }
  }
);

databaseTest(
  'a creature can move through the shared box into another profile without changing identity',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const source = await profile(client, owner);
    const destination = await profile(client, owner, 1);
    await box(client, owner);
    const owned = await creature(client, owner, source);
    // Controlled SQL checks schema compatibility; save/transfer API is a later step.
    await client.query('BEGIN');
    await client.query(
      'UPDATE player_creatures SET profile_id = NULL, location = $1 WHERE id = $2',
      [Location.TRADE_BOX, owned.id]
    );
    await client.query(
      'UPDATE game_profiles SET revision = revision + 1 WHERE id = $1',
      [source.id]
    );
    await client.query(
      'UPDATE account_trade_boxes SET revision = revision + 1 WHERE account_id = $1',
      [owner]
    );
    await client.query('COMMIT');
    await client.query('DELETE FROM game_profiles WHERE id = $1', [source.id]);
    await client.query('BEGIN');
    await client.query(
      'UPDATE player_creatures SET profile_id = $1, location = $2 WHERE id = $3',
      [destination.id, Location.STORAGE, owned.id]
    );
    await client.query(
      'UPDATE game_profiles SET revision = revision + 1 WHERE id = $1',
      [destination.id]
    );
    await client.query(
      'UPDATE account_trade_boxes SET revision = revision + 1 WHERE account_id = $1',
      [owner]
    );
    await client.query('COMMIT');
    const moved = (await client.query('SELECT * FROM player_creatures'))
      .rows[0];
    assert.equal(moved.id, owned.id);
    assert.equal(moved.original_owner_id, owned.original_owner_id);
    assert.equal(moved.profile_id, destination.id);
    assert.equal(moved.owner_account_id, owner);
    assert.equal(moved.location, Location.STORAGE);
    assert.equal(
      (
        await client.query('SELECT revision FROM game_profiles WHERE id = $1', [
          destination.id,
        ])
      ).rows[0].revision,
      2
    );
    assert.equal(
      (
        await client.query(
          'SELECT revision FROM account_trade_boxes WHERE account_id = $1',
          [owner]
        )
      ).rows[0].revision,
      3
    );
  }
);

databaseTest(
  'deleting a profile retains its account box and other profiles',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const save = await profile(client, owner);
    const other = await profile(client, owner, 1);
    await box(client, owner);
    await creature(client, owner, save);
    await creature(client, owner, save, { location: Location.STORAGE });
    const boxed = await creature(client, owner);
    const remaining = await creature(client, owner, other);
    await client.query('DELETE FROM game_profiles WHERE id = $1', [save.id]);
    assert.deepEqual(
      (
        await client.query('SELECT id FROM player_creatures ORDER BY id')
      ).rows.map((row) => row.id),
      [boxed.id, remaining.id].sort()
    );
    assert.equal(
      (
        await client.query(
          'SELECT count(*)::int AS count FROM account_trade_boxes'
        )
      ).rows[0].count,
      1
    );
  }
);

databaseTest(
  'account deletion removes owned data while retaining traded creature provenance',
  async (t) => {
    const { client } = await fixture(t);
    const original = await account(client);
    const receiver = await account(client);
    const save = await profile(client, original);
    const receiverSave = await profile(client, receiver);
    await box(client, original);
    await creature(client, original, save);
    await creature(client, original);
    const traded = await creature(client, receiver, receiverSave, {
      originalOwner: original,
    });
    await client.query('DELETE FROM "user" WHERE id = $1', [original]);
    const rows = (
      await client.query('SELECT id, original_owner_id FROM player_creatures')
    ).rows;
    assert.deepEqual(rows, [{ id: traded.id, original_owner_id: original }]);
    assert.equal(
      (
        await client.query(
          'SELECT count(*)::int AS count FROM game_profiles WHERE account_id = $1',
          [original]
        )
      ).rows[0].count,
      0
    );
    assert.equal(
      (
        await client.query(
          'SELECT count(*)::int AS count FROM account_trade_boxes WHERE account_id = $1',
          [original]
        )
      ).rows[0].count,
      0
    );
  }
);

databaseTest(
  'recreating a slot gives it a new identity even when its revision restarts',
  async (t) => {
    const { client } = await fixture(t);
    const owner = await account(client);
    const old = await profile(client, owner);
    await client.query('DELETE FROM game_profiles WHERE id = $1', [old.id]);
    const replacement = await profile(client, owner);
    assert.notEqual(replacement.id, old.id);
    assert.equal(replacement.revision, old.revision);
    // Controlled SQL demonstrates the identity/revision condition the API will use.
    const stale = await client.query(
      'UPDATE game_profiles SET revision = revision + 1 WHERE id = $1 AND account_id = $2 AND revision = $3',
      [old.id, owner, old.revision]
    );
    assert.equal(stale.rowCount, 0);
  }
);
