import { testDefinitionId } from '@/__tests__/utils/dataBuilders';
import { describe, expect, it } from 'vitest';
import { GameFlag, type Item } from '@/types/baseGame';
import { makePlayerCreature, makeProfile } from './dataBuilders';

describe('test data isolation', () => {
  it('creates independent default collections on every call', () => {
    const first = makePlayerCreature({
      id: 'first',
      speciesId: testDefinitionId('test-species'),
    });
    const second = makePlayerCreature({
      id: 'second',
      speciesId: testDefinitionId('test-species'),
    });
    first.equippedAttacks.push(testDefinitionId('TEST_MOVE'));
    expect(second.equippedAttacks).toEqual([]);

    const firstProfile = makeProfile();
    const secondProfile = makeProfile();
    firstProfile.creatures.push(first);
    firstProfile.storageCreatures.push(second);
    firstProfile.gameFlags.push(GameFlag.STARTER_PALMIT);
    firstProfile.capturedSpeciesIds!.push(first.speciesId);
    expect(secondProfile.creatures).toEqual([]);
    expect(secondProfile.storageCreatures).toEqual([]);
    expect(secondProfile.gameFlags).toEqual([]);
    expect(secondProfile.capturedSpeciesIds).toEqual([]);
  });

  it('preserves explicit creature inputs without sharing their move arrays', () => {
    const moves = [testDefinitionId('TEST_MOVE')];
    const creature = makePlayerCreature({
      id: 'subject',
      speciesId: testDefinitionId('test-species'),
      originalOwnerId: 'test-account',
      gender: 'genderless',
      level: 7,
      xp: 12,
      isShiny: true,
      equippedAttacks: moves,
    });
    expect(creature).toMatchObject({
      originalOwnerId: 'test-account',
      gender: 'genderless',
      level: 7,
      xp: 12,
      isShiny: true,
    });
    creature.equippedAttacks.push(testDefinitionId('ANOTHER_MOVE'));
    expect(moves).toEqual([testDefinitionId('TEST_MOVE')]);
  });

  it('isolates supplied party, storage, inventory, flags, and capture history', () => {
    const creature = makePlayerCreature({
      id: 'subject',
      speciesId: testDefinitionId('test-species'),
      equippedAttacks: [testDefinitionId('TEST_MOVE')],
    });
    const item: Item = {
      id: 'test-item',
      name: 'Test item',
      description: 'Controlled input',
      effect: 'HEAL',
      value: 1,
      count: 2,
    };
    const inputs = {
      ownerId: 'test-account',
      creatures: [creature],
      storageCreatures: [creature],
      inventory: [item],
      gameFlags: [GameFlag.STARTER_PALMIT],
      capturedSpeciesIds: [testDefinitionId('test-species')],
    };
    const first = makeProfile(inputs);
    const second = makeProfile(inputs);
    expect(first.ownerId).toBe(inputs.ownerId);
    first.creatures[0].level++;
    first.creatures[0].equippedAttacks.push(testDefinitionId('ANOTHER_MOVE'));
    first.storageCreatures[0].equippedAttacks.length = 0;
    first.inventory[0].count--;
    first.gameFlags.length = 0;
    first.capturedSpeciesIds!.length = 0;
    expect(second.creatures).toEqual([creature]);
    expect(second.storageCreatures).toEqual([creature]);
    expect(second.inventory).toEqual([item]);
    expect(second.gameFlags).toEqual(inputs.gameFlags);
    expect(second.capturedSpeciesIds).toEqual(inputs.capturedSpeciesIds);
    expect(creature.equippedAttacks).toEqual([testDefinitionId('TEST_MOVE')]);
    expect(item.count).toBe(2);
  });
});
