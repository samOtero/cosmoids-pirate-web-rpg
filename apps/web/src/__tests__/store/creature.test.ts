import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { STARTER_CRAB, STARTER_IGUANA } from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Creature Store Logic', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should update creature level and xp when updateCreatures is called', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add PlayerCreature
    store.addCreatureToProfile(profileId, {
      id: STARTER_CRAB.id,
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.learnableAttacks.map((a) => a.attackId),
      gender: 'female' as const,
      isShiny: false,
    });

    // Verify initial state
    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].level).toBe(1);
    expect(profile.creatures[0].xp).toBe(0);
    const addedCreature = profile.creatures[0];

    // Act: Update Creature xp/level via updateCreatures
    const updatedCreature = { ...addedCreature, level: 5, xp: 500 };
    store.updateCreatures([updatedCreature]);

    // Assert
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].level).toBe(5);
    expect(profile.creatures[0].xp).toBe(500);
  });

  it('should update multiple creatures', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add two PlayerCreatures
    store.addCreatureToProfile(profileId, {
      id: STARTER_CRAB.id,
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.learnableAttacks.map((a) => a.attackId),
      gender: 'female' as const,
      isShiny: false,
    });
    store.addCreatureToProfile(profileId, {
      id: STARTER_IGUANA.id,
      speciesId: STARTER_IGUANA.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_IGUANA.learnableAttacks.map((a) => a.attackId),
      gender: 'female' as const,
      isShiny: false,
    });

    const profileBefore = useGameStore.getState().profiles[0]!;
    const added1 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_CRAB.id
    )!;
    const added2 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_IGUANA.id
    )!;

    // Act: Update both levels
    const updated1 = { ...added1, level: 10, xp: 1000 };
    const updated2 = { ...added2, level: 8, xp: 800 };
    store.updateCreatures([updated1, updated2]);

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    const c1 = profile.creatures.find((c) => c.speciesId === STARTER_CRAB.id);
    const c2 = profile.creatures.find((c) => c.speciesId === STARTER_IGUANA.id);

    expect(c1?.level).toBe(10);
    expect(c2?.level).toBe(8);
  });

  it('should retain every captured form after multi-stage evolution', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    store.addCreatureToProfile(profileId, {
      id: 'evolving-bug',
      speciesId: 'bug_stage_1',
      level: 6,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    });

    let profile = useGameStore.getState().profiles[profileId]!;
    const evolvingBug = profile.creatures[0];
    expect(profile.capturedSpeciesIds).toEqual(['bug_stage_1']);

    store.updateCreatures([
      { ...evolvingBug, speciesId: 'bug_stage_2', level: 7 },
    ]);
    profile = useGameStore.getState().profiles[profileId]!;
    expect(profile.capturedSpeciesIds).toEqual(['bug_stage_1', 'bug_stage_2']);

    store.updateCreatures([
      { ...profile.creatures[0], speciesId: 'bug_stage_3', level: 10 },
    ]);
    profile = useGameStore.getState().profiles[profileId]!;
    expect(profile.creatures[0].speciesId).toBe('bug_stage_3');
    expect(profile.capturedSpeciesIds).toEqual([
      'bug_stage_1',
      'bug_stage_2',
      'bug_stage_3',
    ]);
  });

  it('should reorder creatures and clamp out-of-bounds target index', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Add three creatures
    store.addCreatureToProfile(profileId, {
      id: 'c1',
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.learnableAttacks.map((a) => a.attackId),
      gender: 'female' as const,
      isShiny: false,
    });
    store.addCreatureToProfile(profileId, {
      id: 'c2',
      speciesId: STARTER_IGUANA.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_IGUANA.learnableAttacks.map((a) => a.attackId),
      gender: 'female' as const,
      isShiny: false,
    });
    store.addCreatureToProfile(profileId, {
      id: 'c3',
      speciesId: 'starter_monkey',
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    });

    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.length).toBe(3);
    const initialIds = profile.creatures.map((c) => c.speciesId);

    // 1. Reorder within bounds (move index 0 to 1)
    store.reorderCreatures(0, 1);
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.map((c) => c.speciesId)).toEqual([
      initialIds[1],
      initialIds[0],
      initialIds[2],
    ]);

    // Reset and test cross-array move (party to storage)
    // Currently order: [iguana, crab, monkey]
    // Move index 0 (iguana) to index 10 (storage index 4, clamped to storage end)
    store.reorderCreatures(0, 10);
    profile = useGameStore.getState().profiles[0]!;
    // Iguana should be removed from party and placed into storage
    expect(profile.creatures.map((c) => c.speciesId)).toEqual([
      initialIds[0],
      initialIds[2],
    ]);
    expect(profile.storageCreatures.map((c) => c.speciesId)).toEqual([
      initialIds[1],
    ]);
  });

  it('should swap occupied party and storage slots without changing roster sizes', () => {
    const store = useGameStore.getState();
    const profileId = 0;
    const partyIds = Array.from({ length: 6 }, (_, index) => `party-${index}`);
    const storageIds = ['storage-0', 'storage-1'];

    partyIds.forEach((id) => {
      store.addCreatureToProfile(profileId, {
        id,
        speciesId: STARTER_CRAB.id,
        level: 1,
        xp: 0,
        equippedAttacks: [],
        gender: 'female' as const,
        isShiny: false,
      });
    });
    storageIds.forEach((id) => {
      store.addCreatureToProfile(
        profileId,
        {
          id,
          speciesId: STARTER_IGUANA.id,
          level: 1,
          xp: 0,
          equippedAttacks: [],
          gender: 'female' as const,
          isShiny: false,
        },
        true
      );
    });

    // Storage slot 1 uses global index 7; exchange it with party slot 2.
    store.reorderCreatures(7, 2);

    const profile = useGameStore.getState().profiles[profileId]!;
    expect(profile.creatures.map((creature) => creature.id)).toEqual([
      'party-0',
      'party-1',
      'storage-1',
      'party-3',
      'party-4',
      'party-5',
    ]);
    expect(profile.storageCreatures.map((creature) => creature.id)).toEqual([
      'storage-0',
      'party-2',
    ]);
    expect(profile.creatures).toHaveLength(6);
    expect(profile.storageCreatures).toHaveLength(2);
  });

  it('should move legacy party overflow to storage without losing creatures', () => {
    const overflowParty = Array.from({ length: 8 }, (_, index) => ({
      id: `legacy-party-${index}`,
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    }));
    const existingStorage = {
      id: 'existing-storage',
      speciesId: STARTER_IGUANA.id,
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    };

    useGameStore.setState((state) => {
      const profiles = [...state.profiles];
      profiles[0] = {
        ...profiles[0]!,
        creatures: overflowParty,
        storageCreatures: [existingStorage],
      };
      return { profiles };
    });

    // Selecting a current-version profile applies the same repair used during
    // persisted-state rehydration.
    useGameStore.getState().selectProfile(0);

    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.map((creature) => creature.id)).toEqual(
      overflowParty.slice(0, 6).map((creature) => creature.id)
    );
    expect(profile.storageCreatures.map((creature) => creature.id)).toEqual([
      'existing-storage',
      'legacy-party-6',
      'legacy-party-7',
    ]);
    expect([
      ...profile.creatures,
      ...profile.storageCreatures,
    ]).toHaveLength(9);
  });

  it('should not add captured creature to active roster if roster has 6 or more creatures', () => {
    const levelData = {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
      placementSpots: [],
    };
    const playerCreatures = Array.from({ length: 6 }, (_, i) => ({
      id: `c_${i}`,
      speciesId: 'starter_crab',
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    }));

    const engine = new TowerDefenseEngine(levelData, playerCreatures);

    // Spawn an enemy to capture
    engine.enemies.push({
      id: 'enemy_test',
      definitionId: 'starter_iguana',
      gender: 'female',
      level: 5,
      position: { x: 0, y: 0 },
      hp: 10,
      maxHp: 10,
      speed: 1,
      currentAttack: 10,
      currentSpecialAttack: 10,
      currentDefense: 10,
      currentSpecialDefense: 10,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: 0,
      facingDirection: 'down',
      damagedByTowerIds: new Set(),
    });

    expect(engine.roster.length).toBe(6);

    const captured = engine.captureEnemy('enemy_test');

    expect(captured).not.toBeNull();
    expect(captured?.speciesId).toBe('starter_iguana');
    // Roster should still be 6, and not have the newly captured creature!
    expect(engine.roster.length).toBe(6);
    expect(engine.roster.some((c) => c.speciesId === 'starter_iguana')).toBe(
      false
    );
  });

  it('should add captured creature to active roster if roster has less than 6 creatures', () => {
    const levelData = {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
      placementSpots: [],
    };
    const playerCreatures = Array.from({ length: 5 }, (_, i) => ({
      id: `c_${i}`,
      speciesId: 'starter_crab',
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    }));

    const engine = new TowerDefenseEngine(levelData, playerCreatures);

    // Spawn an enemy to capture
    engine.enemies.push({
      id: 'enemy_test',
      definitionId: 'starter_iguana',
      gender: 'female',
      level: 5,
      position: { x: 0, y: 0 },
      hp: 10,
      maxHp: 10,
      speed: 1,
      currentAttack: 10,
      currentSpecialAttack: 10,
      currentDefense: 10,
      currentSpecialDefense: 10,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: 0,
      facingDirection: 'down',
      damagedByTowerIds: new Set(),
    });

    expect(engine.roster.length).toBe(5);

    const captured = engine.captureEnemy('enemy_test');

    expect(captured).not.toBeNull();
    expect(captured?.speciesId).toBe('starter_iguana');
    // Roster should now be 6, and contain the newly captured creature!
    expect(engine.roster.length).toBe(6);
    expect(engine.roster.some((c) => c.speciesId === 'starter_iguana')).toBe(
      true
    );
  });

  it('should add creature directly to storage when forceStorage is true', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Act: Add PlayerCreature with forceStorage = true
    store.addCreatureToProfile(
      profileId,
      {
        id: STARTER_CRAB.id,
        speciesId: STARTER_CRAB.id,
        level: 1,
        xp: 0,
        equippedAttacks: STARTER_CRAB.learnableAttacks.map((a) => a.attackId),
        gender: 'female' as const,
        isShiny: false,
      },
      true
    );

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures).toHaveLength(0);
    expect(profile.storageCreatures).toHaveLength(1);
    expect(profile.storageCreatures[0].speciesId).toBe(STARTER_CRAB.id);
  });

  it('should retain isShiny status on enemy when captured', () => {
    const levelData = {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
      placementSpots: [],
    };
    const playerCreatures = Array.from({ length: 2 }, (_, i) => ({
      id: `c_${i}`,
      speciesId: 'starter_crab',
      level: 1,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    }));

    const engine = new TowerDefenseEngine(levelData, playerCreatures);

    // Spawn a shiny enemy
    engine.enemies.push({
      id: 'enemy_shiny',
      definitionId: 'starter_iguana',
      gender: 'female',
      level: 5,
      position: { x: 0, y: 0 },
      hp: 10,
      maxHp: 10,
      speed: 1,
      currentAttack: 10,
      currentSpecialAttack: 10,
      currentDefense: 10,
      currentSpecialDefense: 10,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: 0,
      facingDirection: 'down',
      damagedByTowerIds: new Set(),
      isShiny: true,
    });

    const captured = engine.captureEnemy('enemy_shiny');

    expect(captured).not.toBeNull();
    expect(captured?.isShiny).toBe(true);
    expect(engine.roster.length).toBe(3);
    expect(engine.roster.find((c) => c.id === captured?.id)?.isShiny).toBe(
      true
    );
  });

  it('should preserve captured creature ID and successfully update its level and xp on level end', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // 1. Setup the profile with a starter creature
    const starterCreatureInput = {
      id: 'starter_crab', // will be replaced with a UUID by addCreatureToProfile
      speciesId: 'starter_crab',
      level: 5,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    };
    store.addCreatureToProfile(profileId, starterCreatureInput);

    // Get the profile after adding the starter to get its correct UUID
    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.length).toBe(1);
    const profileStarter = profile.creatures[0];

    const levelData = {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
      placementSpots: [],
    };

    // 2. Initialize the engine with the profile's active party (which contains the starter)
    const engine = new TowerDefenseEngine(levelData, [profileStarter]);

    // Spawn an enemy
    engine.enemies.push({
      id: 'enemy_to_catch',
      definitionId: 'mouse_1',
      level: 3,
      position: { x: 0, y: 0 },
      hp: 10,
      maxHp: 10,
      speed: 1,
      currentAttack: 5,
      currentSpecialAttack: 5,
      currentDefense: 5,
      currentSpecialDefense: 5,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: 0,
      facingDirection: 'down',
      damagedByTowerIds: new Set(),
      gender: 'female' as const,
      isShiny: false,
    });

    // 3. Capture the enemy in-level
    const captured = engine.captureEnemy('enemy_to_catch');
    expect(captured).not.toBeNull();
    // Assert UUID format
    expect(captured?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // 4. Simulate the UI adding the captured creature to the profile
    store.addCreatureToProfile(profileId, captured!);

    // Verify the profile received the creature with the EXACT SAME ID
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.length).toBe(2);
    expect(profile.creatures[1].id).toBe(captured?.id);

    // 5. Gain experience and level up on the engine's roster for this captured creature
    const capturedRosterRef = engine.roster.find((c) => c.id === captured?.id);
    expect(capturedRosterRef).toBeDefined();
    capturedRosterRef!.level = 10;
    capturedRosterRef!.xp = 2000;

    // 6. Simulate level end and save progress
    store.updateCreatures(engine.roster);

    // Verify that the captured creature on the profile got its level and XP persisted!
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[1].level).toBe(10);
    expect(profile.creatures[1].xp).toBe(2000);
  });
});
