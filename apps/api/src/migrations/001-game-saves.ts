import type { MigrationBuilder } from 'node-pg-migrate';

/** Historical SQL: change the schema through a new migration, never this one. */
const sql = `
CREATE TABLE game_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    slot SMALLINT NOT NULL CONSTRAINT game_profiles_slot_check
        CHECK (slot BETWEEN 0 AND 2),
    profile_version INTEGER NOT NULL CHECK (profile_version > 0),
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    profile_data JSONB NOT NULL CONSTRAINT game_profiles_data_check CHECK (
        jsonb_typeof(profile_data) = 'object'
        AND NOT (profile_data ?| ARRAY[
            'creatures', 'storageCreatures', 'id', 'ownerId', 'version'
        ])
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT game_profiles_account_slot_unique UNIQUE (account_id, slot),
    CONSTRAINT game_profiles_id_account_unique UNIQUE (id, account_id)
);

CREATE TABLE account_trade_boxes (
    account_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE player_creatures (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_account_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    original_owner_id TEXT NOT NULL CHECK (
        length(trim(original_owner_id)) > 0
        AND trim(original_owner_id) <> 'guest'
    ),
    profile_id UUID,
    -- 0 = party, 1 = storage, 2 = account trade box.
    location SMALLINT NOT NULL CHECK (location IN (0, 1, 2)),
    position INTEGER NOT NULL CHECK (position >= 0),
    species_id INTEGER NOT NULL CHECK (species_id > 0),
    -- 0 = genderless, 1 = male, 2 = female.
    gender SMALLINT NOT NULL CHECK (gender IN (0, 1, 2)),
    level INTEGER NOT NULL CHECK (level >= 1),
    xp INTEGER NOT NULL CHECK (xp >= 0),
    is_shiny BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_attack_ids INTEGER[] NOT NULL,
    active_attack_index SMALLINT NOT NULL DEFAULT 0,
    targeting_mode TEXT NOT NULL DEFAULT 'first' CHECK (
        targeting_mode IN (
            'first', 'last', 'closest', 'strongest', 'weakest',
            'lowest-hp-percent', 'highest-hp-percent'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT player_creatures_profile_owner_fk
        FOREIGN KEY (profile_id, owner_account_id)
        REFERENCES game_profiles(id, account_id) ON DELETE CASCADE,
    CONSTRAINT player_creatures_location_profile_check CHECK (
        (location = 2 AND profile_id IS NULL)
        OR (location IN (0, 1) AND profile_id IS NOT NULL)
    ),
    CONSTRAINT player_creatures_party_position_check
        CHECK (location <> 0 OR position < 6),
    CONSTRAINT player_creatures_attacks_check CHECK (
        CASE WHEN array_ndims(equipped_attack_ids) = 1
            AND array_lower(equipped_attack_ids, 1) = 1
            AND cardinality(equipped_attack_ids) BETWEEN 1 AND 4
        THEN array_position(equipped_attack_ids, NULL) IS NULL
            AND 0 < ALL(equipped_attack_ids)
        ELSE FALSE END
    ),
    CONSTRAINT player_creatures_active_attack_check CHECK (
        active_attack_index >= 0
        AND active_attack_index < cardinality(equipped_attack_ids)
    ),
    CONSTRAINT player_creatures_position_unique
        UNIQUE NULLS NOT DISTINCT (
            owner_account_id, profile_id, location, position
        ) DEFERRABLE INITIALLY IMMEDIATE
);
`;

export function up(pgm: MigrationBuilder) {
  pgm.sql(sql);
}

// Undoing this initial schema would delete player saves. Use forward migrations.
export const down = false;
