import type { MigrationBuilder } from 'node-pg-migrate';

/** Preserve the existing collections while moving their order off creature rows. */
export function up(pgm: MigrationBuilder) {
  pgm.sql(`
    ALTER TABLE game_profiles ADD COLUMN party_order TEXT[] NOT NULL DEFAULT '{}'
      CHECK (cardinality(party_order) = 0 OR CASE
        WHEN array_ndims(party_order) = 1 AND array_lower(party_order, 1) = 1
        THEN cardinality(party_order) <= 6 AND array_position(party_order, NULL) IS NULL
        ELSE FALSE END);

    CREATE TABLE profile_storage_boxes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id UUID NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
      position INTEGER NOT NULL CHECK (position >= 0),
      creature_order TEXT[] NOT NULL DEFAULT '{}'
        CHECK (cardinality(creature_order) = 0 OR CASE
          WHEN array_ndims(creature_order) = 1 AND array_lower(creature_order, 1) = 1
          THEN cardinality(creature_order) <= 10000 AND array_position(creature_order, NULL) IS NULL
          ELSE FALSE END),
      CONSTRAINT profile_storage_boxes_id_profile_unique UNIQUE (id, profile_id),
      CONSTRAINT profile_storage_boxes_position_unique UNIQUE (profile_id, position)
        DEFERRABLE INITIALLY IMMEDIATE
    );
    INSERT INTO profile_storage_boxes (profile_id, name, position)
      SELECT id, 'Box 1', 0 FROM game_profiles;
    UPDATE game_profiles p SET party_order = COALESCE(
      (SELECT array_agg(c.id ORDER BY c.position) FROM player_creatures c
       WHERE c.profile_id = p.id AND c.location = 0), '{}');
    UPDATE profile_storage_boxes b SET creature_order = COALESCE(
      (SELECT array_agg(c.id ORDER BY c.position) FROM player_creatures c
       WHERE c.profile_id = b.profile_id AND c.location = 1), '{}');

    ALTER TABLE player_creatures ADD COLUMN storage_box_id UUID;
    UPDATE player_creatures c SET storage_box_id = b.id FROM profile_storage_boxes b
      WHERE c.profile_id = b.profile_id AND c.location = 1;
    ALTER TABLE player_creatures
      DROP CONSTRAINT player_creatures_position_unique,
      DROP CONSTRAINT player_creatures_party_position_check,
      ALTER COLUMN position DROP NOT NULL;
    UPDATE player_creatures SET position = NULL WHERE location IN (0, 1);
    ALTER TABLE player_creatures ADD CONSTRAINT player_creatures_storage_box_fk
      FOREIGN KEY (storage_box_id, profile_id) REFERENCES profile_storage_boxes(id, profile_id);
    ALTER TABLE player_creatures ADD CONSTRAINT player_creatures_storage_box_check CHECK (
      (location = 1 AND storage_box_id IS NOT NULL AND position IS NULL)
      OR (location = 0 AND storage_box_id IS NULL AND position IS NULL)
      OR (location = 2 AND storage_box_id IS NULL AND position IS NOT NULL)
    );
    -- The account trade box retains its existing positioning until its API is built.
    CREATE UNIQUE INDEX player_creatures_trade_position_unique
      ON player_creatures (owner_account_id, position) WHERE location = 2;
    CREATE INDEX player_creatures_storage_box_idx ON player_creatures (storage_box_id);
    CREATE INDEX player_creatures_profile_idx ON player_creatures (profile_id);
  `);
}

export const down = false;
