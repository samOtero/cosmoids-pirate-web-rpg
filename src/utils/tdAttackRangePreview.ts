export interface TDRangePreviewRadii {
  x: number;
  y: number;
}

/**
 * Convert an attack range expressed in normalized battlefield units into the
 * rendered radii that represent the same targeting boundary on screen.
 */
export function getTDRangePreviewRadii(
  rangeIndex: number,
  battlefieldWidth: number,
  battlefieldHeight: number
): TDRangePreviewRadii {
  const normalizedRange = Math.max(0, rangeIndex) / 100;
  return {
    x: battlefieldWidth * normalizedRange,
    y: battlefieldHeight * normalizedRange,
  };
}
