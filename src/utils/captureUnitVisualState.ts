import { CaptureUnit } from '@/engine/tower-defense/types';

export type CaptureUnitVisualState =
  | CaptureUnit['facingDirection']
  | 'idle'
  | 'carried';

export function getCaptureUnitVisualState(
  captureUnit: CaptureUnit,
  elapsedTimeMs: number
): CaptureUnitVisualState {
  if (captureUnit.heldByEnemyId) return 'carried';

  const isReturningHome =
    captureUnit.returnHome !== undefined &&
    captureUnit.returnHomeAvailableAtMs !== undefined &&
    elapsedTimeMs >= captureUnit.returnHomeAvailableAtMs;

  return isReturningHome ? captureUnit.facingDirection : 'idle';
}
