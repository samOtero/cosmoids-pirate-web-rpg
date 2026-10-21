import type { Pool, PoolClient } from 'pg';
import { SaveError } from './profile-validation.js';
import {
  CreatureGenderCode,
  CreatureLocationCode,
} from './game-save-values.js';

const accountColumns = `id, name, email, "emailVerified", "createdAt", "updatedAt"`;
const profileColumns = `p.id, p.account_id AS "accountId", p.slot,
  p.profile_version AS "profileVersion", p.revision,
  p.created_at AS "createdAt", p.saved_at AS "savedAt", p.profile_data AS "profileData",
  (SELECT count(*)::int FROM player_creatures c WHERE c.profile_id = p.id AND c.location = 0) AS "partyCount",
  (SELECT count(*)::int FROM player_creatures c WHERE c.profile_id = p.id AND c.location = 1) AS "storageCount"`;
const creatureColumns = `id, owner_account_id AS "accountId", original_owner_id AS "originalOwnerId",
  profile_id AS "profileId", location, position, species_id AS "speciesId", gender,
  level, xp, is_shiny AS "isShiny", equipped_attack_ids AS "equippedAttacks",
  active_attack_index AS "activeAttackIndex", targeting_mode AS "targetingMode",
  created_at AS "createdAt", updated_at AS "updatedAt"`;
const locations = {
  [CreatureLocationCode.PARTY]: 'party',
  [CreatureLocationCode.STORAGE]: 'storage',
  [CreatureLocationCode.TRADE_BOX]: 'tradeBox',
};
const genders = {
  [CreatureGenderCode.GENDERLESS]: 'genderless',
  [CreatureGenderCode.MALE]: 'male',
  [CreatureGenderCode.FEMALE]: 'female',
};
const missing = () =>
  new SaveError(404, 'ADMIN_NOT_FOUND', 'This record is no longer available.');
function creature(row: Record<string, unknown>) {
  return {
    ...row,
    location: locations[row.location as keyof typeof locations],
    gender: genders[row.gender as keyof typeof genders],
  };
}

/** Inspection queries use read-only transactions and select no auth secrets. */
export class AdminRepository {
  constructor(
    private pool: Pool,
    private maxProfiles: number
  ) {}

  private async read<T>(fn: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  accounts(search: string, limit: number, offset: number) {
    return this.read(async (client) => {
      const where = `WHERE strpos(lower(email), lower($1)) > 0 OR strpos(lower(name), lower($1)) > 0 OR id = $1`;
      const total = (
        await client.query(
          `SELECT count(*)::int AS total FROM "user" ${where}`,
          [search]
        )
      ).rows[0].total;
      const { rows } = await client.query(
        `SELECT ${accountColumns},
        (SELECT count(*)::int FROM game_profiles p WHERE p.account_id = "user".id) AS "profileCount",
        (SELECT count(*)::int FROM player_creatures c WHERE c.owner_account_id = "user".id) AS "creatureCount"
        FROM "user" ${where} ORDER BY "createdAt" DESC, id LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      );
      return { items: rows, total, limit, offset };
    });
  }

  account(id: string) {
    return this.read(async (client) => {
      const account = (
        await client.query(
          `SELECT ${accountColumns} FROM "user" WHERE id = $1`,
          [id]
        )
      ).rows[0];
      if (!account) throw missing();
      const profiles = (
        await client.query(
          `SELECT ${profileColumns} FROM game_profiles p WHERE account_id = $1 ORDER BY slot`,
          [id]
        )
      ).rows;
      const slots: (Record<string, unknown> | null)[] = Array(
        this.maxProfiles
      ).fill(null);
      for (const profile of profiles) slots[profile.slot] = profile;
      const box = (
        await client.query(
          `SELECT revision, updated_at AS "updatedAt" FROM account_trade_boxes WHERE account_id = $1`,
          [id]
        )
      ).rows[0];
      const count = (
        await client.query(
          'SELECT count(*)::int AS total FROM player_creatures WHERE owner_account_id = $1 AND location = $2',
          [id, CreatureLocationCode.TRADE_BOX]
        )
      ).rows[0].total;
      return {
        account,
        slots,
        tradeBox: {
          revision: box?.revision ?? null,
          updatedAt: box?.updatedAt ?? null,
          creatureCount: count,
        },
      };
    });
  }

  profile(id: string) {
    return this.read(async (client) => {
      const row = (
        await client.query(
          `SELECT ${profileColumns} FROM game_profiles p WHERE p.id = $1`,
          [id]
        )
      ).rows[0];
      if (!row) throw missing();
      return row;
    });
  }

  creatures(
    accountId: string,
    location: number,
    profileId: string | null,
    limit: number,
    offset: number
  ) {
    return this.read(async (client) => {
      if (
        !(
          await client.query('SELECT id FROM "user" WHERE id = $1', [accountId])
        ).rows.length
      )
        throw missing();
      if (
        profileId &&
        !(
          await client.query(
            'SELECT id FROM game_profiles WHERE id = $1 AND account_id = $2',
            [profileId, accountId]
          )
        ).rows.length
      )
        throw missing();
      const args = [accountId, location, profileId];
      const where =
        'WHERE owner_account_id = $1 AND location = $2 AND profile_id IS NOT DISTINCT FROM $3::uuid';
      const total = (
        await client.query(
          `SELECT count(*)::int AS total FROM player_creatures ${where}`,
          args
        )
      ).rows[0].total;
      const rows = (
        await client.query(
          `SELECT ${creatureColumns} FROM player_creatures ${where} ORDER BY position, id LIMIT $4 OFFSET $5`,
          [...args, limit, offset]
        )
      ).rows;
      return { items: rows.map(creature), total, limit, offset };
    });
  }

  creature(id: string) {
    return this.read(async (client) => {
      const row = (
        await client.query(
          `SELECT ${creatureColumns} FROM player_creatures WHERE id = $1`,
          [id]
        )
      ).rows[0];
      if (!row) throw missing();
      return creature(row);
    });
  }
}
