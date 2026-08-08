import { Point, TDLevelData } from '@/engine/tower-defense/types';

export function createEmptyTDLevelDraft(): TDLevelData {
  return {
    paths: [[]],
    placementSpots: [],
    captureUnits: [],
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
  validCreatureDefinitionIds?: ReadonlySet<string>
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
  });
  levelData.environmentUnits?.forEach((unit, index) => {
    validatePoint(unit.position, `Environment unit ${index + 1}`, errors);
    if (!unit.tdConfigId.trim()) {
      errors.push(`Environment unit ${index + 1} needs a TD config ID.`);
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
      if (!group.definitionId.trim()) {
        errors.push(`${groupLabel} needs an enemy type.`);
      } else if (
        validCreatureDefinitionIds &&
        !validCreatureDefinitionIds.has(group.definitionId)
      ) {
        errors.push(
          `${groupLabel} references unknown enemy "${group.definitionId}".`
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
      if (
        group.level !== undefined &&
        (!Number.isInteger(group.level) || group.level < 1)
      ) {
        errors.push(`${groupLabel} level must be a positive integer.`);
      }
      if (
        group.speedMultiplier !== undefined &&
        (!Number.isFinite(group.speedMultiplier) || group.speedMultiplier <= 0)
      ) {
        errors.push(`${groupLabel} speed multiplier must be greater than 0.`);
      }
      if (
        group.hpMultiplier !== undefined &&
        (!Number.isFinite(group.hpMultiplier) || group.hpMultiplier <= 0)
      ) {
        errors.push(`${groupLabel} HP multiplier must be greater than 0.`);
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
