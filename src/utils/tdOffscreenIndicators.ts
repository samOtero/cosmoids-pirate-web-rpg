export interface TDOffscreenEnemyMarker {
  id: string;
  x: number;
  y: number;
  isObjectiveCarrier: boolean;
}

export interface TDEdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TDOffscreenIndicator {
  id: string;
  x: number;
  y: number;
  angle: number;
  count: number;
  hasObjectiveCarrier: boolean;
}

const DEFAULT_EDGE_INSETS: TDEdgeInsets = {
  top: 52,
  right: 54,
  bottom: 94,
  left: 46,
};

function isOutsideViewport(
  marker: TDOffscreenEnemyMarker,
  width: number,
  height: number
) {
  return marker.x < 0 || marker.x > width || marker.y < 0 || marker.y > height;
}

function projectDirectionToSafeEdge(
  angle: number,
  width: number,
  height: number,
  insets: TDEdgeInsets
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const minX = Math.min(insets.left, centerX);
  const maxX = Math.max(minX, width - insets.right);
  const minY = Math.min(insets.top, centerY);
  const maxY = Math.max(minY, height - insets.bottom);
  const horizontalScale =
    directionX > 0
      ? (maxX - centerX) / directionX
      : directionX < 0
        ? (minX - centerX) / directionX
        : Infinity;
  const verticalScale =
    directionY > 0
      ? (maxY - centerY) / directionY
      : directionY < 0
        ? (minY - centerY) / directionY
        : Infinity;
  const scale = Math.max(0, Math.min(horizontalScale, verticalScale));

  return {
    x: centerX + directionX * scale,
    y: centerY + directionY * scale,
  };
}

export const DEFAULT_MIN_INDICATOR_DISTANCE = 160;

/** Groups off-screen enemies into stable directional sectors and projects one
 * indicator per sector onto a HUD-safe viewport edge. Indicators closer than
 * minDistance along the screen edge are merged together. */
export function buildTDOffscreenIndicators(
  markers: TDOffscreenEnemyMarker[],
  width: number,
  height: number,
  insets: TDEdgeInsets = DEFAULT_EDGE_INSETS,
  sectorCount: number = 4,
  minDistance: number = DEFAULT_MIN_INDICATOR_DISTANCE
): TDOffscreenIndicator[] {
  if (width <= 0 || height <= 0 || sectorCount <= 0) return [];

  const centerX = width / 2;
  const centerY = height / 2;
  const sectorSize = (Math.PI * 2) / sectorCount;
  const groups = new Map<
    number,
    {
      count: number;
      directionX: number;
      directionY: number;
      hasObjectiveCarrier: boolean;
    }
  >();

  for (const marker of markers) {
    if (!isOutsideViewport(marker, width, height)) continue;
    const angle = Math.atan2(marker.y - centerY, marker.x - centerX);
    const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
    const sector =
      Math.floor((normalizedAngle + sectorSize / 2) / sectorSize) % sectorCount;
    const group = groups.get(sector) ?? {
      count: 0,
      directionX: 0,
      directionY: 0,
      hasObjectiveCarrier: false,
    };
    group.count += 1;
    group.directionX += Math.cos(angle);
    group.directionY += Math.sin(angle);
    group.hasObjectiveCarrier ||= marker.isObjectiveCarrier;
    groups.set(sector, group);
  }

  interface SectorIndicatorCandidate {
    sectors: number[];
    directionX: number;
    directionY: number;
    count: number;
    hasObjectiveCarrier: boolean;
    x: number;
    y: number;
    angle: number;
  }

  const rawIndicators: SectorIndicatorCandidate[] = [...groups.entries()].map(
    ([sector, group]) => {
      const angle = Math.atan2(group.directionY, group.directionX);
      const position = projectDirectionToSafeEdge(angle, width, height, insets);
      return {
        sectors: [sector],
        directionX: group.directionX,
        directionY: group.directionY,
        count: group.count,
        hasObjectiveCarrier: group.hasObjectiveCarrier,
        angle,
        ...position,
      };
    }
  );

  if (minDistance <= 0 || rawIndicators.length <= 1) {
    return rawIndicators.map((ind) => ({
      id: `sector_${ind.sectors.join('_')}`,
      x: ind.x,
      y: ind.y,
      angle: ind.angle,
      count: ind.count,
      hasObjectiveCarrier: ind.hasObjectiveCarrier,
    }));
  }

  // Iteratively merge candidates whose projected screen positions are within minDistance
  let list = rawIndicators;
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < minDistance) {
          const dirX = a.directionX + b.directionX;
          const dirY = a.directionY + b.directionY;
          const angle = Math.atan2(dirY, dirX);
          const position = projectDirectionToSafeEdge(
            angle,
            width,
            height,
            insets
          );
          const combinedSectors = [...a.sectors, ...b.sectors].sort(
            (s1, s2) => s1 - s2
          );
          const combined: SectorIndicatorCandidate = {
            sectors: combinedSectors,
            directionX: dirX,
            directionY: dirY,
            count: a.count + b.count,
            hasObjectiveCarrier: a.hasObjectiveCarrier || b.hasObjectiveCarrier,
            angle,
            ...position,
          };
          list.splice(j, 1);
          list.splice(i, 1, combined);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  return list.map((ind) => ({
    id: `sector_${ind.sectors.join('_')}`,
    x: ind.x,
    y: ind.y,
    angle: ind.angle,
    count: ind.count,
    hasObjectiveCarrier: ind.hasObjectiveCarrier,
  }));
}
