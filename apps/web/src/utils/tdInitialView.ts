import { TDInitialView, TDOpeningPan } from '@/engine/tower-defense/types';

export const DEFAULT_TD_VIEW_OFFSET_X = 50;
export const DEFAULT_TD_VIEW_OFFSET_Y = 0;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Resolves optional level camera settings while preserving legacy defaults. */
export function resolveTDInitialView(
  backgroundScale: number | undefined,
  initialView: TDInitialView | undefined
): TDInitialView {
  const scale = Math.max(1, backgroundScale ?? 1);
  const minimumZoom = 1 / scale;

  return {
    offsetX: clamp(initialView?.offsetX ?? DEFAULT_TD_VIEW_OFFSET_X, 0, 100),
    offsetY: clamp(initialView?.offsetY ?? DEFAULT_TD_VIEW_OFFSET_Y, 0, 100),
    zoom: clamp(initialView?.zoom ?? 1, minimumZoom, 1),
  };
}

/** Resolves the eased camera position for a level's opening map tour. */
export function resolveTDOpeningPanView(
  initialView: TDInitialView,
  openingPan: TDOpeningPan,
  progress: number
): Pick<TDInitialView, 'offsetX' | 'offsetY'> {
  const clampedProgress = clamp(progress, 0, 1);
  const easedProgress =
    clampedProgress < 0.5
      ? 4 * clampedProgress * clampedProgress * clampedProgress
      : 1 - Math.pow(-2 * clampedProgress + 2, 3) / 2;
  const fromOffsetX = clamp(
    openingPan.fromOffsetX ?? initialView.offsetX,
    0,
    100
  );
  const fromOffsetY = clamp(
    openingPan.fromOffsetY ?? initialView.offsetY,
    0,
    100
  );

  return {
    offsetX: fromOffsetX + (initialView.offsetX - fromOffsetX) * easedProgress,
    offsetY: fromOffsetY + (initialView.offsetY - fromOffsetY) * easedProgress,
  };
}
