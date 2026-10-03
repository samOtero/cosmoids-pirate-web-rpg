import { Point, TDLevelData } from '@/engine/tower-defense/types';
import { expandWaveRepetitions } from '@/engine/tower-defense/waveSchedule';

export function createEmptyTDLevelDraft(): TDLevelData {
  return {
    paths: [[]],
    placementSpots: [],
    captureUnits: [],
    waveEnemyDefinitions: [],
    waves: [],
  };
}

export function cloneTDLevelDraft(levelData: TDLevelData): TDLevelData {
  return structuredClone(levelData);
}

function roundPoint(point: Point): void {
  point.x = Number(point.x.toFixed(2));
  point.y = Number(point.y.toFixed(2));
}

/**
 * Produces a save-safe copy without reconstructing the level shape. Mutating
 * only known coordinates means new top-level and nested fields are retained
 * automatically when TDLevelData grows.
 */
export function prepareTDLevelDraftForSave(
  levelData: TDLevelData
): TDLevelData {
  const savedLevel = cloneTDLevelDraft(levelData);

  savedLevel.paths.forEach((path) => path.forEach(roundPoint));
  savedLevel.placementSpots.forEach(roundPoint);
  if (savedLevel.towerRecovery) {
    roundPoint(savedLevel.towerRecovery.healerPosition);
  }
  savedLevel.captureUnits?.forEach((unit) => roundPoint(unit.position));
  savedLevel.captureUnits?.forEach((unit) =>
    unit.waveRelocations?.forEach((relocation) =>
      relocation.path.forEach(roundPoint)
    )
  );
  savedLevel.environmentUnits?.forEach((unit) => roundPoint(unit.position));
  savedLevel.waveEnemyDefinitions.forEach((definition) => {
    if (definition.stationaryPosition) {
      roundPoint(definition.stationaryPosition);
    }
    const structure = definition.structure;
    if (!structure) return;
    if (structure.position) roundPoint(structure.position);
    const layout = structure.visualLayout;
    if (!layout) return;
    for (const sprite of [layout.standing, layout.rubble]) {
      sprite.offsetX = Number(sprite.offsetX.toFixed(2));
      sprite.offsetY = Number(sprite.offsetY.toFixed(2));
      sprite.width = Number(sprite.width.toFixed(2));
      sprite.height = Number(sprite.height.toFixed(2));
      for (const field of [
        'rotationDegrees',
        'skewXDegrees',
        'skewYDegrees',
      ] as const) {
        if (sprite[field] !== undefined) {
          sprite[field] = Number(sprite[field].toFixed(2));
        }
      }
    }
    layout.labelOffsetY = Number(layout.labelOffsetY.toFixed(2));
    layout.healthBarOffsetY = Number(layout.healthBarOffsetY.toFixed(2));
  });

  return savedLevel;
}

function validatePoint(point: Point, label: string, errors: string[]): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    errors.push(`${label} must have finite x and y coordinates.`);
    return;
  }
}

export function validateTDLevelDraft(
  levelData: TDLevelData,
  validCreatureDefinitionIds?: ReadonlySet<string>,
  validEnemyAbilityIds?: ReadonlySet<string>
): string[] {
  const errors: string[] = [];

  if (
    levelData.reinforcementBossDefinitionId !== undefined &&
    !levelData.waveEnemyDefinitions.some(
      (definition) =>
        definition.id === levelData.reinforcementBossDefinitionId &&
        definition.creatureId &&
        !definition.structure
    )
  ) {
    errors.push('The reinforcement boss must reference a creature encounter.');
  }

  if (levelData.paths.length === 0) {
    errors.push('At least one enemy path is required.');
  }

  levelData.paths.forEach((path, pathIndex) => {
    if (path.length < 2) {
      errors.push(`Path ${pathIndex + 1} needs at least two points.`);
    }
    path.forEach((point, pointIndex) =>
      validatePoint(
        point,
        `Path ${pathIndex + 1}, point ${pointIndex + 1}`,
        errors
      )
    );
  });

  levelData.placementSpots.forEach((point, index) =>
    validatePoint(point, `Placement spot ${index + 1}`, errors)
  );
  levelData.safePlacementSpotIndices?.forEach((spotIndex) => {
    if (
      !Number.isInteger(spotIndex) ||
      spotIndex < 0 ||
      spotIndex >= levelData.placementSpots.length
    ) {
      errors.push('A safe placement spot references an invalid placement.');
    }
  });
  if (levelData.towerRecovery) {
    const recovery = levelData.towerRecovery;
    validatePoint(recovery.healerPosition, 'Tower recovery healer', errors);
    recovery.placementSpotIndices.forEach((spotIndex) => {
      if (
        !Number.isInteger(spotIndex) ||
        spotIndex < 0 ||
        spotIndex >= levelData.placementSpots.length
      ) {
        errors.push('A tower recovery spot references an invalid placement.');
      }
    });
    if (
      !Number.isFinite(recovery.healFraction) ||
      recovery.healFraction <= 0 ||
      recovery.healFraction > 1
    ) {
      errors.push(
        'Tower recovery heal fraction must be greater than 0 and at most 1.'
      );
    }
    if (
      !Number.isFinite(recovery.feedingIntervalMs) ||
      recovery.feedingIntervalMs <= 0
    ) {
      errors.push('Tower recovery feeding interval must be greater than 0.');
    }
    if (
      recovery.tutorial &&
      (!Number.isFinite(recovery.tutorial.triggerHealthFraction) ||
        recovery.tutorial.triggerHealthFraction <= 0 ||
        recovery.tutorial.triggerHealthFraction > 1)
    ) {
      errors.push(
        'Tower recovery tutorial health threshold must be greater than 0 and at most 1.'
      );
    }
  }
  levelData.captureUnits?.forEach((unit, index) => {
    validatePoint(unit.position, `Capture unit ${index + 1}`, errors);
    if (!unit.tdConfigId.trim()) {
      errors.push(`Capture unit ${index + 1} needs a TD config ID.`);
    }
    if (
      unit.haulPathIndex !== undefined &&
      (!Number.isInteger(unit.haulPathIndex) ||
        unit.haulPathIndex < 0 ||
        unit.haulPathIndex >= levelData.paths.length)
    ) {
      errors.push(
        `Capture unit ${index + 1} hauling behavior references an invalid path.`
      );
    }
    if (unit.groupHauling) {
      const hauling = unit.groupHauling;
      if (!hauling.eligibleCreatureId.trim()) {
        errors.push(
          `Capture unit ${index + 1} group hauling needs an eligible creature ID.`
        );
      }
      if (!Number.isFinite(hauling.joinRadius) || hauling.joinRadius <= 0) {
        errors.push(
          `Capture unit ${index + 1} group hauling join radius must be greater than 0.`
        );
      }
      if (
        !Number.isFinite(hauling.baseSpeedMultiplier) ||
        hauling.baseSpeedMultiplier <= 0
      ) {
        errors.push(
          `Capture unit ${index + 1} group hauling base speed must be greater than 0.`
        );
      }
      if (
        !Number.isFinite(hauling.speedMultiplierPerAdditionalHauler) ||
        hauling.speedMultiplierPerAdditionalHauler < 0
      ) {
        errors.push(
          `Capture unit ${index + 1} group hauling speed increase cannot be negative.`
        );
      }
      if (
        !Number.isFinite(hauling.maxSpeedMultiplier) ||
        hauling.maxSpeedMultiplier < hauling.baseSpeedMultiplier
      ) {
        errors.push(
          `Capture unit ${index + 1} group hauling max speed cannot be below its base speed.`
        );
      }
    }
    if (unit.returnHome) {
      if (
        !Number.isInteger(unit.returnHome.pathIndex) ||
        unit.returnHome.pathIndex < 0 ||
        unit.returnHome.pathIndex >= levelData.paths.length
      ) {
        errors.push(
          `Capture unit ${index + 1} return-home behavior references an invalid path.`
        );
      }
      if (
        !Number.isFinite(unit.returnHome.speed) ||
        unit.returnHome.speed <= 0
      ) {
        errors.push(
          `Capture unit ${index + 1} return-home speed must be greater than 0.`
        );
      }
      if (
        unit.returnHome.delayMs !== undefined &&
        (!Number.isFinite(unit.returnHome.delayMs) ||
          unit.returnHome.delayMs < 0)
      ) {
        errors.push(
          `Capture unit ${index + 1} return-home delay cannot be negative.`
        );
      }
    }
    unit.waveRelocations?.forEach((relocation, relocationIndex) => {
      const relocationLabel = `Capture unit ${index + 1}, relocation ${relocationIndex + 1}`;
      if (
        !Number.isInteger(relocation.afterWaveIndex) ||
        relocation.afterWaveIndex < 0 ||
        relocation.afterWaveIndex >=
          expandWaveRepetitions(levelData.waves).length - 1
      ) {
        errors.push(`${relocationLabel} must follow a non-final wave.`);
      }
      if (relocation.path.length < 2) {
        errors.push(`${relocationLabel} needs at least two path points.`);
      }
      relocation.path.forEach((point, pointIndex) =>
        validatePoint(
          point,
          `${relocationLabel}, point ${pointIndex + 1}`,
          errors
        )
      );
      if (!Number.isFinite(relocation.speed) || relocation.speed <= 0) {
        errors.push(`${relocationLabel} speed must be greater than 0.`);
      }
    });
  });
  levelData.environmentUnits?.forEach((unit, index) => {
    validatePoint(unit.position, `Environment unit ${index + 1}`, errors);
    if (!unit.tdConfigId.trim()) {
      errors.push(`Environment unit ${index + 1} needs a TD config ID.`);
    }
  });

  const enemyDefinitionIds = new Set<string>();
  levelData.waveEnemyDefinitions.forEach((definition, definitionIndex) => {
    const definitionLabel = `Enemy definition ${definitionIndex + 1}`;
    if (definition.stationaryPosition) {
      validatePoint(
        definition.stationaryPosition,
        `${definitionLabel} stationary position`,
        errors
      );
    }
    if (!definition.id.trim()) {
      errors.push(`${definitionLabel} needs an ID.`);
    } else if (enemyDefinitionIds.has(definition.id)) {
      errors.push(
        `${definitionLabel} has the duplicate ID "${definition.id}".`
      );
    }
    enemyDefinitionIds.add(definition.id);

    if (definition.structure) {
      const structure = definition.structure;
      if (!definition.structure.tdConfigId.trim()) {
        errors.push(`${definitionLabel} structure needs a TD config ID.`);
      }
      if (!definition.structure.displayName.trim()) {
        errors.push(`${definitionLabel} structure needs a display name.`);
      }
      if (definition.structure.elementTypes.length === 0) {
        errors.push(`${definitionLabel} structure needs an element type.`);
      }
      const structureStats = [
        ['max HP', definition.structure.maxHp],
        ['defense', definition.structure.defense],
        ['special defense', definition.structure.specialDefense],
      ] as const;
      structureStats.forEach(([name, value]) => {
        if (!Number.isFinite(value) || value <= 0) {
          errors.push(
            `${definitionLabel} structure ${name} must be greater than 0.`
          );
        }
      });
      if (structure.position) {
        validatePoint(
          structure.position,
          `${definitionLabel} structure position`,
          errors
        );
      }
      if (structure.visualLayout) {
        const layout = structure.visualLayout;
        for (const [name, sprite] of [
          ['standing', layout.standing],
          ['rubble', layout.rubble],
        ] as const) {
          if (
            !Number.isFinite(sprite.offsetX) ||
            !Number.isFinite(sprite.offsetY)
          ) {
            errors.push(
              `${definitionLabel} structure ${name} offsets must be finite.`
            );
          }
          if (
            [
              sprite.rotationDegrees,
              sprite.skewXDegrees,
              sprite.skewYDegrees,
            ].some((value) => value !== undefined && !Number.isFinite(value))
          ) {
            errors.push(
              `${definitionLabel} structure ${name} rotation and skew must be finite.`
            );
          }
          if (
            !Number.isFinite(sprite.width) ||
            !Number.isFinite(sprite.height) ||
            sprite.width <= 0 ||
            sprite.height <= 0
          ) {
            errors.push(
              `${definitionLabel} structure ${name} size must be greater than 0.`
            );
          }
        }
        if (!Number.isFinite(layout.labelOffsetY)) {
          errors.push(
            `${definitionLabel} structure label offset must be finite.`
          );
        }
        if (!Number.isFinite(layout.healthBarOffsetY)) {
          errors.push(
            `${definitionLabel} structure health bar offset must be finite.`
          );
        }
      }
    } else if (!definition.creatureId?.trim()) {
      errors.push(`${definitionLabel} needs a creature ID.`);
    } else if (
      validCreatureDefinitionIds &&
      !validCreatureDefinitionIds.has(definition.creatureId)
    ) {
      errors.push(
        `${definitionLabel} references unknown creature "${definition.creatureId}".`
      );
    }
    if (!Number.isInteger(definition.level) || definition.level < 1) {
      errors.push(`${definitionLabel} level must be a positive integer.`);
    }
    if (
      definition.goalDamage !== undefined &&
      (!Number.isInteger(definition.goalDamage) || definition.goalDamage < 1)
    ) {
      errors.push(`${definitionLabel} goal damage must be a positive integer.`);
    }

    const multipliers = [
      ['speed', definition.speedMultiplier],
      ['HP', definition.hpMultiplier],
      ['defense', definition.defenseMultiplier],
      ['special defense', definition.specialDefenseMultiplier],
    ] as const;
    multipliers.forEach(([name, multiplier]) => {
      if (
        multiplier !== undefined &&
        (!Number.isFinite(multiplier) || multiplier <= 0)
      ) {
        errors.push(
          `${definitionLabel} ${name} multiplier must be greater than 0.`
        );
      }
    });

    if (
      definition.abilityId &&
      validEnemyAbilityIds &&
      !validEnemyAbilityIds.has(definition.abilityId)
    ) {
      errors.push(
        `${definitionLabel} references unknown ability "${definition.abilityId}".`
      );
    }

    if (
      definition.weakenedThreshold !== undefined &&
      (!Number.isFinite(definition.weakenedThreshold) ||
        definition.weakenedThreshold <= 0 ||
        definition.weakenedThreshold > 1)
    ) {
      errors.push(
        `${definitionLabel} weakened threshold must be greater than 0 and at most 1.`
      );
    }
  });

  const waveIds = new Set<string>();
  levelData.waves.forEach((wave, waveIndex) => {
    const waveLabel = `Wave ${waveIndex + 1}`;
    if (!wave.id.trim()) {
      errors.push(`${waveLabel} needs an ID.`);
    } else if (waveIds.has(wave.id)) {
      errors.push(`${waveLabel} has the duplicate ID "${wave.id}".`);
    }
    waveIds.add(wave.id);

    if (
      wave.repeatCount !== undefined &&
      (!Number.isInteger(wave.repeatCount) || wave.repeatCount < 1)
    ) {
      errors.push(`${waveLabel} repeat count must be a positive integer.`);
    }
    if (
      wave.delayBetweenRepeatsMs !== undefined &&
      (!Number.isFinite(wave.delayBetweenRepeatsMs) ||
        wave.delayBetweenRepeatsMs < 0)
    ) {
      errors.push(`${waveLabel} repeat delay cannot be negative.`);
    }

    wave.groups.forEach((group, groupIndex) => {
      const groupLabel = `${waveLabel}, group ${groupIndex + 1}`;
      if (!group.enemyDefinitionId.trim()) {
        errors.push(`${groupLabel} needs an enemy definition.`);
      } else if (!enemyDefinitionIds.has(group.enemyDefinitionId)) {
        errors.push(
          `${groupLabel} references unknown enemy definition "${group.enemyDefinitionId}".`
        );
      }

      if (group.encounterPool) {
        if (group.encounterPool.length === 0) {
          errors.push(`${groupLabel} encounter pool needs at least one entry.`);
        }
        const total = group.encounterPool.reduce(
          (sum, entry) => sum + entry.weight,
          0
        );
        if (!Number.isFinite(total) || total <= 0) {
          errors.push(
            `${groupLabel} encounter pool needs a finite positive total weight.`
          );
        }
        group.encounterPool.forEach((entry, entryIndex) => {
          const label = `${groupLabel}, encounter ${entryIndex + 1}`;
          if (!enemyDefinitionIds.has(entry.enemyDefinitionId)) {
            errors.push(
              `${label} references unknown enemy definition "${entry.enemyDefinitionId}".`
            );
          }
          if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
            errors.push(`${label} weight must be greater than 0.`);
          }
          if (
            entry.pathIndex !== undefined &&
            (!Number.isInteger(entry.pathIndex) ||
              entry.pathIndex < 0 ||
              entry.pathIndex >= levelData.paths.length)
          ) {
            errors.push(`${label} references an invalid path.`);
          }
          if (
            group.laneHop &&
            (entry.pathIndex ?? group.pathIndex) ===
              group.laneHop.targetPathIndex
          ) {
            errors.push(`${label} lane hop must target a different path.`);
          }
        });
      }

      if (!Number.isInteger(group.count) || group.count < 1) {
        errors.push(`${groupLabel} count must be a positive integer.`);
      }
      if (
        !Number.isFinite(group.spawnIntervalMs) ||
        group.spawnIntervalMs < 0
      ) {
        errors.push(`${groupLabel} spawn interval cannot be negative.`);
      }
      if (
        !Number.isFinite(group.delayBeforeGroupMs) ||
        group.delayBeforeGroupMs < 0
      ) {
        errors.push(`${groupLabel} delay cannot be negative.`);
      }
      if (
        !Number.isInteger(group.pathIndex) ||
        group.pathIndex < 0 ||
        group.pathIndex >= levelData.paths.length
      ) {
        errors.push(`${groupLabel} references an invalid path.`);
      }
      if (group.laneHop) {
        const hop = group.laneHop;
        if (
          !Number.isInteger(hop.targetPathIndex) ||
          hop.targetPathIndex < 0 ||
          hop.targetPathIndex >= levelData.paths.length ||
          hop.targetPathIndex === group.pathIndex
        ) {
          errors.push(
            `${groupLabel} lane hop references an invalid target path.`
          );
        }
        if (
          !Number.isFinite(hop.triggerProgress) ||
          hop.triggerProgress <= 0 ||
          hop.triggerProgress >= 1
        ) {
          errors.push(
            `${groupLabel} lane hop trigger must be between 0 and 1.`
          );
        }
        if (!Number.isFinite(hop.windupMs) || hop.windupMs < 0) {
          errors.push(`${groupLabel} lane hop windup cannot be negative.`);
        }
        if (!Number.isFinite(hop.durationMs) || hop.durationMs <= 0) {
          errors.push(
            `${groupLabel} lane hop duration must be greater than 0.`
          );
        }
        if (!Number.isFinite(hop.arcHeight) || hop.arcHeight < 0) {
          errors.push(`${groupLabel} lane hop arc height cannot be negative.`);
        }
      }
    });
  });

  if (
    levelData.surviveUntil !== undefined &&
    (!Number.isFinite(levelData.surviveUntil) || levelData.surviveUntil <= 0)
  ) {
    errors.push('Survival time must be greater than 0 when enabled.');
  }
  if (
    levelData.lives !== undefined &&
    (!Number.isInteger(levelData.lives) || levelData.lives < -1)
  ) {
    errors.push('Lives must be an integer of -1 or greater.');
  }
  if (
    levelData.backgroundScale !== undefined &&
    (!Number.isFinite(levelData.backgroundScale) ||
      levelData.backgroundScale < 1)
  ) {
    errors.push('Background scale must be at least 1.');
  }

  if (levelData.initialView) {
    const { offsetX, offsetY, zoom } = levelData.initialView;
    if (!Number.isFinite(offsetX) || offsetX < 0 || offsetX > 100) {
      errors.push('Initial view X offset must be between 0 and 100.');
    }
    if (!Number.isFinite(offsetY) || offsetY < 0 || offsetY > 100) {
      errors.push('Initial view Y offset must be between 0 and 100.');
    }

    const minimumZoom = 1 / Math.max(1, levelData.backgroundScale ?? 1);
    if (!Number.isFinite(zoom) || zoom < minimumZoom || zoom > 1) {
      errors.push(`Initial view zoom must be between ${minimumZoom} and 1.`);
    }
  }

  if (levelData.flagDuel) {
    const duel = levelData.flagDuel;
    const runner = duel.alliedRunner;
    if (!Number.isInteger(duel.rivalFlagLives) || duel.rivalFlagLives <= 0) {
      errors.push('Rival flag lives must be a positive integer.');
    }
    if (
      validCreatureDefinitionIds &&
      !validCreatureDefinitionIds.has(runner.creatureId)
    ) {
      errors.push(
        'The allied flag runner must reference a registered creature.'
      );
    }
    if (
      !Number.isInteger(runner.pathIndex) ||
      !levelData.paths[runner.pathIndex]
    ) {
      errors.push('The allied flag runner must reference a valid path.');
    }
    for (const [name, value] of Object.entries({
      level: runner.level,
      speed: runner.speed,
      spawnIntervalMs: runner.spawnIntervalMs,
    })) {
      if (!Number.isFinite(value) || value <= 0)
        errors.push(`Flag runner ${name} must be positive.`);
    }
    for (const value of [runner.firstSpawnDelayMs, runner.strikeDurationMs]) {
      if (!Number.isFinite(value) || value < 0)
        errors.push('Flag runner timings must be nonnegative.');
    }
    for (const defender of duel.defenders) {
      if (
        !levelData.waveEnemyDefinitions.some(
          (entry) => entry.id === defender.enemyDefinitionId && entry.creatureId
        )
      ) {
        errors.push('Flag defenders must reference creature encounters.');
      }
      for (const value of [
        defender.range,
        defender.damage,
        defender.cooldownMs,
      ]) {
        if (!Number.isFinite(value) || value <= 0)
          errors.push(
            'Flag defender range, damage, and cooldown must be positive.'
          );
      }
    }
  }

  return errors;
}
