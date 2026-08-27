/**
 * Convert a range expressed as a percentage of the base viewport height into
 * its rendered radius. Background size is deliberately excluded so the same
 * attack has the same world-space reach on every level.
 */
export function getTDRangePreviewRadius(
  rangeIndex: number,
  viewportHeight: number,
  zoom: number
): number {
  return viewportHeight * zoom * (Math.max(0, rangeIndex) / 100);
}
