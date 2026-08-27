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

/** Groups off-screen enemies into stable directional sectors and projects one
 * indicator per sector onto a HUD-safe viewport edge. */
export function buildTDOffscreenIndicators(
  markers: TDOffscreenEnemyMarker[],
  width: number,
  height: number,
  insets: TDEdgeInsets = DEFAULT_EDGE_INSETS,
  sectorCount: number = 16
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

  return [...groups.entries()].map(([sector, group]) => {
    const angle = Math.atan2(group.directionY, group.directionX);
    const position = projectDirectionToSafeEdge(angle, width, height, insets);
    return {
      id: `sector_${sector}`,
      ...position,
      angle,
      count: group.count,
      hasObjectiveCarrier: group.hasObjectiveCarrier,
    };
  });
}
