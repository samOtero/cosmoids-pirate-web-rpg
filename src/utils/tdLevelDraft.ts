import { Point, TDLevelData } from '@/engine/tower-defense/types';

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
  savedLevel.captureUnits?.forEach((unit) => roundPoint(unit.position));
  savedLevel.captureUnits?.forEach((unit) =>
    unit.waveRelocations?.forEach((relocation) =>
      relocation.path.forEach(roundPoint)
    )
  );
  savedLevel.environmentUnits?.forEach((unit) => roundPoint(unit.position));

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
  levelData.captureUnits?.forEach((unit, index) => {
    validatePoint(unit.position, `Capture unit ${index + 1}`, errors);
    if (!unit.tdConfigId.trim()) {
      errors.push(`Capture unit ${index + 1} needs a TD config ID.`);
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
        relocation.afterWaveIndex >= levelData.waves.length - 1
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
    if (!definition.id.trim()) {
      errors.push(`${definitionLabel} needs an ID.`);
    } else if (enemyDefinitionIds.has(definition.id)) {
      errors.push(
        `${definitionLabel} has the duplicate ID "${definition.id}".`
      );
    }
    enemyDefinitionIds.add(definition.id);

    if (!definition.creatureId.trim()) {
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

    wave.groups.forEach((group, groupIndex) => {
      const groupLabel = `${waveLabel}, group ${groupIndex + 1}`;
      if (!group.enemyDefinitionId.trim()) {
        errors.push(`${groupLabel} needs an enemy definition.`);
      } else if (!enemyDefinitionIds.has(group.enemyDefinitionId)) {
        errors.push(
          `${groupLabel} references unknown enemy definition "${group.enemyDefinitionId}".`
        );
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

  return errors;
}
