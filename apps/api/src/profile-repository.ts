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
  type SaveChanges,
  type StorageBox,
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
  party_order: string[];
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
  position: number | null;
  storage_box_id: string | null;
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

  private async storageBoxes(client: PoolClient, profileId: string) {
    return (
      await client.query<StorageBox>(
        'SELECT id, name, position, creature_order AS "creatureIds" FROM profile_storage_boxes WHERE profile_id = $1 ORDER BY position, id',
        [profileId]
      )
    ).rows;
  }

  private async fullProfile(client: PoolClient, row: ProfileRow) {
    const creatures = (
      await client.query<CreatureRow>(
        'SELECT * FROM player_creatures WHERE profile_id = $1 AND owner_account_id = $2',
        [row.id, row.account_id]
      )
    ).rows;
    const boxes = await this.storageBoxes(client, row.id);
    const byId = new Map(creatures.map((c) => [c.id, c]));
    const ordered = [
      ...row.party_order,
      ...boxes.flatMap((b) => b.creatureIds),
    ];
    if (
      ordered.length !== byId.size ||
      new Set(ordered).size !== ordered.length
    )
      throw creatureConflict();
    const read = (ids: string[], location: number, boxId: string | null) =>
      ids.map((id) => {
        const creature = byId.get(id);
        if (
          !creature ||
          creature.location !== location ||
          creature.storage_box_id !== boxId
        )
          throw creatureConflict();
        return wireCreature(creature);
      });
    return {
      ...this.metadata(row),
      profileData: row.profile_data,
      creatures: read(row.party_order, Location.PARTY, null),
      storageCreatures: boxes.flatMap((b) =>
        read(b.creatureIds, Location.STORAGE, b.id)
      ),
      storageBoxes: boxes,
    };
  }

  private metadata(row: ProfileRow) {
    return {
      id: row.id,
      slot: row.slot,
      profileVersion: row.profile_version,
      revision: row.revision,
      createdAt: row.created_at.toISOString(),
      savedAt: row.saved_at.toISOString(),
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
          `INSERT INTO game_profiles (account_id, slot, profile_version, profile_data, party_order)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [
            accountId,
            slot,
            snapshot.profileVersion,
            snapshot.profileData,
            snapshot.creatures.map((c) => c.id),
          ]
        )
      ).rows[0]!;
      const box = (
        await client.query<StorageBox>(
          `INSERT INTO profile_storage_boxes (profile_id, name, position, creature_order)
         VALUES ($1, 'Box 1', 0, $2) RETURNING id, name, position, creature_order AS "creatureIds"`,
          [row.id, snapshot.storageCreatures.map((c) => c.id)]
        )
      ).rows[0]!;
      await this.writeCreatures(client, accountId, row, {
        profileVersion: snapshot.profileVersion,
        added: [...snapshot.creatures, ...snapshot.storageCreatures],
        updated: [],
        order: {
          party: snapshot.creatures.map((c) => c.id),
          storage: [box],
        },
      });
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
    changes: SaveChanges
  ) {
    return this.transaction(async (client) => {
      const previous = await this.lock(client, accountId, id, revision);
      const partyOrder = await this.writeCreatures(
        client,
        accountId,
        previous,
        changes
      );
      const row = (
        await client.query<ProfileRow>(
          `UPDATE game_profiles SET profile_data = $1, profile_version = $2, party_order = $5,
        revision = revision + 1, saved_at = CURRENT_TIMESTAMP WHERE id = $3 AND account_id = $4 RETURNING *`,
          [
            changes.profileData ?? previous.profile_data,
            changes.profileVersion,
            id,
            accountId,
            partyOrder,
          ]
        )
      ).rows[0]!;
      return this.metadata(row);
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
    profile: ProfileRow,
    changes: SaveChanges
  ) {
    const id = profile.id;
    const incoming = [...changes.added, ...changes.updated];
    const hasOrder =
      changes.order?.party !== undefined ||
      changes.order?.storage !== undefined;
    if (!incoming.length && !hasOrder) return profile.party_order;
    const current = hasOrder
      ? await client.query<CreatureRow>(
          'SELECT * FROM player_creatures WHERE profile_id = $1 OR id = ANY($2::text[])',
          [id, incoming.map((c) => c.id)]
        )
      : await client.query<CreatureRow>(
          'SELECT * FROM player_creatures WHERE id = ANY($1::text[])',
          [incoming.map((c) => c.id)]
        );
    const existing = new Map(current.rows.map((row) => [row.id, row]));
    for (const creature of changes.added)
      if (existing.has(creature.id)) throw creatureConflict();
    for (const creature of changes.updated) {
      const old = existing.get(creature.id);
      if (!old || old.owner_account_id !== accountId || old.profile_id !== id)
        throw creatureConflict();
      if (
        creature.gender !== genders[old.gender] ||
        creature.isShiny !== old.is_shiny ||
        !this.canEvolve(old.species_id, creature.speciesId, creature.level)
      )
        throw new SaveError(
          400,
          'INVALID_CREATURE_CHANGE',
          'Creature identity, gender and shiny status must be preserved.'
        );
    }
    const partyOrder = changes.order?.party ?? profile.party_order;
    const placements = new Map<
      string,
      { location: number; boxId: string | null }
    >();
    if (hasOrder) {
      const boxes = await this.storageBoxes(client, id);
      const byBoxId = new Map(boxes.map((b) => [b.id, b]));
      for (const box of changes.order?.storage ?? []) byBoxId.set(box.id, box);
      const merged = [...byBoxId.values()];
      if (
        merged.length > 1000 ||
        new Set(merged.map((b) => b.position)).size !== merged.length ||
        merged.reduce((n, b) => n + b.creatureIds.length, 0) > 10000
      )
        throw creatureConflict();
      const place = (
        creatureId: string,
        location: number,
        boxId: string | null
      ) => {
        if (placements.has(creatureId)) throw creatureConflict();
        placements.set(creatureId, { location, boxId });
      };
      for (const creatureId of partyOrder)
        place(creatureId, Location.PARTY, null);
      for (const box of merged)
        for (const creatureId of box.creatureIds)
          place(creatureId, Location.STORAGE, box.id);
      const expected = new Set([
        ...current.rows
          .filter(
            (c) => c.profile_id === id && c.owner_account_id === accountId
          )
          .map((c) => c.id),
        ...changes.added.map((c) => c.id),
      ]);
      if (
        placements.size !== expected.size ||
        [...placements.keys()].some((id) => !expected.has(id))
      )
        throw creatureConflict();
      if (changes.order?.storage) {
        await client.query(
          'SET CONSTRAINTS profile_storage_boxes_position_unique DEFERRED'
        );
        for (const box of changes.order.storage) {
          if (boxes.some((b) => b.id === box.id)) {
            await client.query(
              'UPDATE profile_storage_boxes SET name = $1, position = $2, creature_order = $3 WHERE id = $4 AND profile_id = $5',
              [box.name, box.position, box.creatureIds, box.id, id]
            );
          } else {
            const inserted = await client.query(
              `INSERT INTO profile_storage_boxes (id, profile_id, name, position, creature_order)
              VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING RETURNING id`,
              [box.id, id, box.name, box.position, box.creatureIds]
            );
            if (inserted.rowCount !== 1) throw creatureConflict();
          }
        }
      }
    }
    const fields = (c: SaveCreature) => [
      c.speciesId,
      genderCodes[c.gender],
      c.level,
      c.xp,
      c.isShiny,
      c.equippedAttacks,
      c.activeAttackIndex,
      c.targetingMode,
    ];
    for (const c of changes.updated) {
      const updated = await client.query(
        `UPDATE player_creatures SET species_id = $1, gender = $2, level = $3, xp = $4,
        is_shiny = $5, equipped_attack_ids = $6, active_attack_index = $7, targeting_mode = $8,
        updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND owner_account_id = $10 AND profile_id = $11`,
        [...fields(c), c.id, accountId, id]
      );
      if (updated.rowCount !== 1) throw creatureConflict();
    }
    for (const c of changes.added) {
      const placement = placements.get(c.id);
      if (!placement) throw creatureConflict();
      const inserted = await client.query(
        `INSERT INTO player_creatures (species_id, gender, level, xp, is_shiny,
        equipped_attack_ids, active_attack_index, targeting_mode, location, storage_box_id, id, owner_account_id, profile_id, original_owner_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$12) ON CONFLICT (id) DO NOTHING RETURNING id`,
        [...fields(c), placement.location, placement.boxId, c.id, accountId, id]
      );
      if (inserted.rowCount !== 1) throw creatureConflict();
    }
    for (const [creatureId, placement] of placements) {
      const old = existing.get(creatureId);
      if (
        !old ||
        (old.location === placement.location &&
          old.storage_box_id === placement.boxId)
      )
        continue;
      const moved = await client.query(
        `UPDATE player_creatures SET location = $1, storage_box_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND owner_account_id = $4 AND profile_id = $5`,
        [placement.location, placement.boxId, creatureId, accountId, id]
      );
      if (moved.rowCount !== 1) throw creatureConflict();
    }
    return partyOrder;
  }
}
