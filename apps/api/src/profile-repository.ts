import type { Pool, PoolClient } from 'pg';
import type { GameContent } from './game-content.js';
import {
  CreatureGenderCode as Gender,
  CreatureLocationCode as Location,
} from './game-save-values.js';
import {
  SaveError,
  type SaveCreature,
  type SaveSnapshot,
} from './profile-validation.js';

const genderCodes = {
  male: Gender.MALE,
  female: Gender.FEMALE,
  genderless: Gender.GENDERLESS,
};
const genders = {
  [Gender.MALE]: 'male',
  [Gender.FEMALE]: 'female',
  [Gender.GENDERLESS]: 'genderless',
};
interface ProfileRow {
  id: string;
  account_id: string;
  slot: number;
  profile_version: number;
  revision: number;
  profile_data: Record<string, unknown>;
  created_at: Date;
  saved_at: Date;
}
interface CreatureRow {
  id: string;
  owner_account_id: string;
  original_owner_id: string;
  profile_id: string | null;
  species_id: number;
  gender: keyof typeof genders;
  level: number;
  xp: number;
  is_shiny: boolean;
  equipped_attack_ids: number[];
  active_attack_index: number;
  targeting_mode: string;
  location: number;
  position: number;
}
function wireCreature(row: CreatureRow) {
  return {
    id: row.id,
    originalOwnerId: row.original_owner_id,
    speciesId: row.species_id,
    gender: genders[row.gender],
    level: row.level,
    xp: row.xp,
    isShiny: row.is_shiny,
    equippedAttacks: row.equipped_attack_ids,
    activeAttackIndex: row.active_attack_index,
    targetingMode: row.targeting_mode,
  };
}
const notFound = () =>
  new SaveError(
    404,
    'PROFILE_NOT_FOUND',
    'This save is no longer available. Refresh your save slots.'
  );
const creatureConflict = () =>
  new SaveError(
    409,
    'CREATURE_CONFLICT',
    'The creature collection changed. Reload this profile before saving.'
  );

export class ProfileRepository {
  constructor(
    private pool: Pool,
    private content: GameContent
  ) {}

  private async transaction<T>(
    fn: (client: PoolClient) => Promise<T>,
    readOnly = false
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query(
        readOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN'
      );
      try {
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }

  private async fullProfile(client: PoolClient, row: ProfileRow) {
    const creatures = await client.query<CreatureRow>(
      'SELECT * FROM player_creatures WHERE profile_id = $1 AND owner_account_id = $2 ORDER BY location, position',
      [row.id, row.account_id]
    );
    return {
      id: row.id,
      slot: row.slot,
      profileVersion: row.profile_version,
      revision: row.revision,
      createdAt: row.created_at.toISOString(),
      savedAt: row.saved_at.toISOString(),
      profileData: row.profile_data,
      creatures: creatures.rows
        .filter((c) => c.location === Location.PARTY)
        .map(wireCreature),
      storageCreatures: creatures.rows
        .filter((c) => c.location === Location.STORAGE)
        .map(wireCreature),
    };
  }

  async list(accountId: string) {
    const rows = await this.pool.query<
      ProfileRow & { party_count: number; storage_count: number }
    >(
      `
      SELECT p.*, (SELECT count(*)::int FROM player_creatures c WHERE c.profile_id = p.id AND c.location = 0) AS party_count,
        (SELECT count(*)::int FROM player_creatures c WHERE c.profile_id = p.id AND c.location = 1) AS storage_count
      FROM game_profiles p WHERE p.account_id = $1 ORDER BY p.slot`,
      [accountId]
    );
    const slots: (Record<string, unknown> | null)[] = Array(
      this.content.maxProfiles
    ).fill(null);
    for (const row of rows.rows)
      slots[row.slot] = {
        id: row.id,
        slot: row.slot,
        revision: row.revision,
        profileVersion: row.profile_version,
        name: row.profile_data.name,
        lastPlayed: row.profile_data.lastPlayed,
        storyProgression: row.profile_data.storyProgression,
        partyCount: row.party_count,
        storageCount: row.storage_count,
        savedAt: row.saved_at.toISOString(),
      };
    return { slots };
  }

  async load(accountId: string, id: string) {
    return this.transaction(async (client) => {
      const result = await client.query<ProfileRow>(
        'SELECT * FROM game_profiles WHERE id = $1 AND account_id = $2',
        [id, accountId]
      );
      if (!result.rows[0]) throw notFound();
      return this.fullProfile(client, result.rows[0]);
    }, true);
  }

  async create(accountId: string, slot: number, snapshot: SaveSnapshot) {
    return this.transaction(async (client) => {
      const row = (
        await client.query<ProfileRow>(
          `INSERT INTO game_profiles (account_id, slot, profile_version, profile_data)
        VALUES ($1, $2, $3, $4) RETURNING *`,
          [accountId, slot, snapshot.profileVersion, snapshot.profileData]
        )
      ).rows[0]!;
      await this.writeCreatures(client, accountId, row.id, snapshot);
      return this.fullProfile(client, row);
    });
  }

  private async lock(
    client: PoolClient,
    accountId: string,
    id: string,
    revision: number
  ) {
    const row = (
      await client.query<ProfileRow>(
        'SELECT * FROM game_profiles WHERE id = $1 AND account_id = $2 FOR UPDATE',
        [id, accountId]
      )
    ).rows[0];
    if (!row) throw notFound();
    if (row.revision !== revision)
      throw new SaveError(
        409,
        'STALE_PROFILE',
        'This save changed on another device. Load the latest saved progress.',
        await this.fullProfile(client, row)
      );
    return row;
  }

  async save(
    accountId: string,
    id: string,
    revision: number,
    snapshot: SaveSnapshot
  ) {
    return this.transaction(async (client) => {
      await this.lock(client, accountId, id, revision);
      await this.writeCreatures(client, accountId, id, snapshot);
      const row = (
        await client.query<ProfileRow>(
          `UPDATE game_profiles SET profile_data = $1, profile_version = $2,
        revision = revision + 1, saved_at = CURRENT_TIMESTAMP WHERE id = $3 AND account_id = $4 RETURNING *`,
          [snapshot.profileData, snapshot.profileVersion, id, accountId]
        )
      ).rows[0]!;
      return this.fullProfile(client, row);
    });
  }

  async delete(accountId: string, id: string, revision: number) {
    return this.transaction(async (client) => {
      await this.lock(client, accountId, id, revision);
      await client.query(
        'DELETE FROM game_profiles WHERE id = $1 AND account_id = $2',
        [id, accountId]
      );
    });
  }

  private canEvolve(
    from: number,
    to: number,
    level: number,
    visited = new Set<number>()
  ): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);
    return (
      this.content.species
        .find((species) => species.id === from)
        ?.evolutionNodes.some(
          (node) =>
            node.level <= level &&
            this.canEvolve(node.evolutionDefId, to, level, visited)
        ) ?? false
    );
  }

  private async writeCreatures(
    client: PoolClient,
    accountId: string,
    id: string,
    snapshot: SaveSnapshot
  ) {
    const incoming = [...snapshot.creatures, ...snapshot.storageCreatures];
    const current = await client.query<CreatureRow>(
      `SELECT * FROM player_creatures
      WHERE profile_id = $1 OR id = ANY($2::text[])`,
      [id, incoming.map((c) => c.id)]
    );
    const existing = new Map(current.rows.map((row) => [row.id, row]));
    const incomingIds = new Set(incoming.map((c) => c.id));
    if (
      current.rows.some(
        (row) => row.profile_id === id && !incomingIds.has(row.id)
      )
    )
      throw creatureConflict();
    for (const creature of incoming) {
      const old = existing.get(creature.id);
      if (old) {
        if (old.owner_account_id !== accountId || old.profile_id !== id)
          throw creatureConflict();
        if (
          (creature.originalOwnerId !== undefined &&
            creature.originalOwnerId !== old.original_owner_id) ||
          creature.gender !== genders[old.gender] ||
          creature.isShiny !== old.is_shiny ||
          !this.canEvolve(old.species_id, creature.speciesId, creature.level)
        ) {
          throw new SaveError(
            400,
            'INVALID_CREATURE_CHANGE',
            'Creature identity, original ownership, gender and shiny status must be preserved.'
          );
        }
      } else if (
        creature.originalOwnerId !== undefined &&
        !['guest', accountId].includes(creature.originalOwnerId)
      ) {
        throw new SaveError(
          400,
          'INVALID_ORIGINAL_OWNER',
          'New creatures receive the authenticated account as their original owner.'
        );
      }
    }
    await client.query(
      'SET CONSTRAINTS player_creatures_position_unique DEFERRED'
    );
    const write = async (
      creature: SaveCreature,
      location: number,
      position: number
    ) => {
      const old = existing.get(creature.id);
      const fields = [
        creature.speciesId,
        genderCodes[creature.gender],
        creature.level,
        creature.xp,
        creature.isShiny,
        creature.equippedAttacks,
        creature.activeAttackIndex,
        creature.targetingMode,
        location,
        position,
      ];
      if (old) {
        const updated = await client.query(
          `UPDATE player_creatures SET species_id = $1, gender = $2, level = $3, xp = $4,
          is_shiny = $5, equipped_attack_ids = $6, active_attack_index = $7, targeting_mode = $8, location = $9, position = $10,
          updated_at = CURRENT_TIMESTAMP WHERE id = $11 AND owner_account_id = $12 AND profile_id = $13`,
          [...fields, creature.id, accountId, id]
        );
        if (updated.rowCount !== 1) throw creatureConflict();
      } else {
        const inserted = await client.query(
          `INSERT INTO player_creatures (species_id, gender, level, xp, is_shiny,
          equipped_attack_ids, active_attack_index, targeting_mode, location, position, id, owner_account_id, profile_id, original_owner_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$12) ON CONFLICT (id) DO NOTHING RETURNING id`,
          [...fields, creature.id, accountId, id]
        );
        if (inserted.rowCount !== 1) throw creatureConflict();
      }
    };
    for (const [position, c] of snapshot.creatures.entries())
      await write(c, Location.PARTY, position);
    for (const [position, c] of snapshot.storageCreatures.entries())
      await write(c, Location.STORAGE, position);
  }
}
