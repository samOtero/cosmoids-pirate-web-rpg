import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { getWaveGroupEncounters } from '@/engine/tower-defense/waveEncounters';
import { expandWaveRepetitions } from '@/engine/tower-defense/waveSchedule';
import { validateTDLevelDraft } from '@/utils/tdLevelDraft';
import type { Point } from '@/engine/tower-defense/types';
import { battle } from '../engine/behaviorFixtures';

function point(position: Point) {
  expect(Number.isFinite(position.x)).toBe(true);
  expect(Number.isFinite(position.y)).toBe(true);
}

describe('level selection registry', () => {
  it('offers registered levels without duplicating their authored layout', () => {
    expect(new Set(LEVEL_ORDER.map((entry) => entry.context)).size).toBe(
      LEVEL_ORDER.length
    );
    for (const entry of LEVEL_ORDER)
      expect(TD_LEVELS[entry.context]).toBeDefined();
  });
});

describe.each(Object.entries(TD_LEVELS))(
  '%s level integration',
  (id, { levelData: level, winEvents, journalCompletion }) => {
    it('has usable routes and valid wave, creature, attack, and objective references', () => {
      expect(
        validateTDLevelDraft(level, new Set(Object.keys(COSMOID_TEMPLATES)))
      ).toEqual([]);
      expect(level.paths.length).toBeGreaterThan(0);
      for (const path of level.paths) {
        expect(path.length).toBeGreaterThanOrEqual(2);
        path.forEach(point);
      }
      level.placementSpots.forEach(point);
      const definitions = new Map(
        level.waveEnemyDefinitions.map((definition) => [
          definition.id,
          definition,
        ])
      );
      expect(definitions.size).toBe(level.waveEnemyDefinitions.length);
      const pathIndex = (index: number) => {
        expect(Number.isInteger(index)).toBe(true);
        expect(
          level.paths[index],
          `${id}: unknown path ${index}`
        ).toBeDefined();
      };
      for (const definition of definitions.values()) {
        expect(
          definition.creatureId !== undefined ||
            definition.structure !== undefined
        ).toBe(true);
        if (definition.creatureId)
          expect(COSMOID_TEMPLATES[definition.creatureId]).toBeDefined();
        // Procedural prison gates are drawn from their layout, without a texture config.
        if (definition.structure && !definition.structure.visualStyle)
          expect(
            CREATURE_TD_CONFIGS[definition.structure.tdConfigId]
          ).toBeDefined();
        if (definition.stationaryPosition) point(definition.stationaryPosition);
        for (const index of definition.balancedLaneHop?.pathIndices ?? [])
          pathIndex(index);
      }
      for (const wave of level.waves) {
        for (const group of wave.groups) {
          expect(
            definitions.get(group.enemyDefinitionId),
            `${id}: unknown enemy ${group.enemyDefinitionId}`
          ).toBeDefined();
          pathIndex(group.pathIndex);
          for (const encounter of getWaveGroupEncounters(group)) {
            expect(definitions.get(encounter.enemyDefinitionId)).toBeDefined();
            expect(Number.isFinite(encounter.weight)).toBe(true);
            expect(encounter.weight).toBeGreaterThan(0);
            pathIndex(encounter.pathIndex ?? group.pathIndex);
          }
          if (group.laneHop) pathIndex(group.laneHop.targetPathIndex);
          expect(Number.isInteger(group.count)).toBe(true);
          expect(group.count).toBeGreaterThanOrEqual(0);
          for (const duration of [
            group.spawnIntervalMs,
            group.delayBeforeGroupMs,
          ]) {
            expect(Number.isFinite(duration)).toBe(true);
            expect(duration).toBeGreaterThanOrEqual(0);
          }
        }
      }
      for (const ally of level.objectiveAllies ?? []) {
        expect(COSMOID_TEMPLATES[ally.creatureId]).toBeDefined();
        expect(definitions.get(ally.gateDefinitionId)?.structure).toBeDefined();
        expect(
          definitions.get(ally.targetStructureDefinitionId)?.structure
        ).toBeDefined();
        point(ally.lockedPosition);
        ally.releasePath.forEach(point);
      }
      for (const creature of [
        ...(level.premadeRoster ?? []),
        ...(level.startingTowers ?? []).map((tower) => tower.creature),
      ]) {
        expect(COSMOID_TEMPLATES[creature.speciesId]).toBeDefined();
        for (const attack of creature.equippedAttacks)
          expect(ATTACK_DEFS[attack]).toBeDefined();
      }
      if (level.resonantEvolution) {
        expect(
          COSMOID_TEMPLATES[level.resonantEvolution.sourceCreatureId]
        ).toBeDefined();
        expect(
          definitions.get(level.resonantEvolution.evolvedEnemyDefinitionId)
        ).toBeDefined();
      }
      if (level.cursedPhase)
        expect(
          definitions.get(level.cursedPhase.enemyDefinitionId)
        ).toBeDefined();
      for (const index of level.safePlacementSpotIndices ?? [])
        expect(level.placementSpots[index]).toBeDefined();
      for (const index of level.towerRecovery?.placementSpotIndices ?? [])
        expect(level.placementSpots[index]).toBeDefined();
    });

    it('ships its configured background and uses finite camera settings', () => {
      if (level.backgroundUrl) {
        expect(level.backgroundUrl).toMatch(/^\/(?!\/)/);
        expect(
          existsSync(
            join(process.cwd(), 'public', level.backgroundUrl.slice(1))
          )
        ).toBe(true);
      }
      if (level.backgroundScale !== undefined) {
        expect(Number.isFinite(level.backgroundScale)).toBe(true);
        expect(level.backgroundScale).toBeGreaterThan(0);
      }
      for (const settings of [level.initialView, level.openingPan]) {
        for (const value of Object.values(settings ?? {}))
          expect(Number.isFinite(value)).toBe(true);
      }
      if (level.initialView) expect(level.initialView.zoom).toBeGreaterThan(0);
      if (level.openingPan)
        expect(level.openingPan.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('initializes scene units and fixed allies from the current authored configuration', () => {
      const engine = battle(level);
      expect(engine.captureUnits).toHaveLength(level.captureUnits?.length ?? 0);
      expect(engine.environmentUnits).toHaveLength(
        level.environmentUnits?.length ?? 0
      );
      expect(engine.hasCaptureUnitsGoal).toBe(
        (level.captureUnits?.length ?? 0) > 0
      );
      expect(engine.lives).toBe(
        level.captureUnits?.length
          ? level.captureUnits.length
          : (level.lives ?? 3)
      );
      expect(engine.cannotLose).toBe(level.cannotLose ?? false);
      for (const [index, config] of (level.environmentUnits ?? []).entries()) {
        expect(CREATURE_TD_CONFIGS[config.tdConfigId]).toBeDefined();
        expect(engine.environmentUnits[index]).toMatchObject({
          tdConfigId: config.tdConfigId,
          position: config.position,
          facingDirection: config.facingDirection ?? 'down',
        });
      }
      for (const [index, config] of (level.captureUnits ?? []).entries()) {
        expect(CREATURE_TD_CONFIGS[config.tdConfigId]).toBeDefined();
        expect(engine.captureUnits[index]).toMatchObject({
          tdConfigId: config.tdConfigId,
          position: config.position,
          homePosition: config.position,
        });
        point(config.position);
        if (config.returnHome)
          expect(level.paths[config.returnHome.pathIndex]).toBeDefined();
        if (config.haulPathIndex !== undefined)
          expect(level.paths[config.haulPathIndex]).toBeDefined();
        if (config.groupHauling) {
          expect(
            COSMOID_TEMPLATES[config.groupHauling.eligibleCreatureId]
          ).toBeDefined();
          if (config.groupHauling.pickupRadius !== undefined) {
            expect(Number.isFinite(config.groupHauling.pickupRadius)).toBe(
              true
            );
            expect(config.groupHauling.pickupRadius).toBeGreaterThan(0);
          }
        }
      }
      expect(engine.towers).toHaveLength(level.startingTowers?.length ?? 0);
      for (const config of level.startingTowers ?? []) {
        const tower = engine.towers.find(
          (entry) => entry.creature.id === config.creature.id
        );
        expect(tower).toMatchObject({
          position: config.position,
          creature: config.creature,
          facingDirection: config.facingDirection ?? 'down',
          isFixed: config.isFixed ?? false,
          receivesExperience: config.receivesExperience ?? false,
        });
        expect(
          engine.roster.some((creature) => creature.id === config.creature.id)
        ).toBe(false);
        if (config.isFixed) {
          expect(engine.removeTower(config.creature.id)).toBe(false);
          expect(
            engine.placeTower(
              config.creature.id,
              config.position.x + 1,
              config.position.y + 1
            )
          ).toBe(false);
          expect(tower?.position).toEqual(config.position);
        }
      }
    });

    it('connects objective relocations and journal completion to the declared level', () => {
      for (const config of level.captureUnits ?? []) {
        let previous = config.position;
        let previousWave = -1;
        for (const relocation of config.waveRelocations ?? []) {
          expect(Number.isInteger(relocation.afterWaveIndex)).toBe(true);
          expect(relocation.afterWaveIndex).toBeGreaterThan(previousWave);
          expect(
            expandWaveRepetitions(level.waves)[relocation.afterWaveIndex]
          ).toBeDefined();
          expect(relocation.path.length).toBeGreaterThanOrEqual(2);
          expect(relocation.path[0]).toEqual(previous);
          relocation.path.forEach(point);
          expect(Number.isFinite(relocation.speed)).toBe(true);
          expect(relocation.speed).toBeGreaterThan(0);
          previous = relocation.path.at(-1)!;
          previousWave = relocation.afterWaveIndex;
        }
      }
      if (journalCompletion) {
        expect(
          winEvents.some(
            (event) =>
              event.type === 'SET_STORY_PROGRESSION' &&
              event.payload !== undefined &&
              'progression' in event.payload &&
              event.payload.progression >= journalCompletion.progression
          )
        ).toBe(true);
      }
    });
  }
);
