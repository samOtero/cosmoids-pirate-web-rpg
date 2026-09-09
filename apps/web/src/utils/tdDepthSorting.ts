const X_DEPTH_TIE_BREAKER = 0.000001;

/**
 * Sort primarily by the vertical ground-contact position. Horizontal position
 * only resolves effectively identical vertical positions.
 */
export function calculateTDWorldDepth(
  groundContactX: number,
  groundContactY: number
): number {
  return groundContactY + groundContactX * X_DEPTH_TIE_BREAKER;
}
