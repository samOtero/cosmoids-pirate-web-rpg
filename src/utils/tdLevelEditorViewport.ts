export interface TDLevelEditorScrollLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Extra canvas room for selecting path points that live beyond map bounds. */
export function getTDLevelEditorOverscroll(
  viewportWidth: number,
  viewportHeight: number
): number {
  return Math.max(80, Math.min(viewportWidth, viewportHeight) * 0.15);
}

export function getTDLevelEditorScrollLimits(
  displayWidth: number,
  displayHeight: number,
  viewportWidth: number,
  viewportHeight: number
): TDLevelEditorScrollLimits {
  const overscroll = getTDLevelEditorOverscroll(viewportWidth, viewportHeight);

  return {
    minX: -overscroll,
    maxX: Math.max(0, displayWidth - viewportWidth) + overscroll,
    minY: -overscroll,
    maxY: Math.max(0, displayHeight - viewportHeight) + overscroll,
  };
}

export function clampTDLevelEditorScroll(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(minimum, Math.min(maximum, value));
}
