import {
  TDStructureSpriteLayout,
  TDStructureVisualLayout,
} from '@/engine/tower-defense/types';

export type PrisonGatePreviewState =
  | 'intact'
  | 'damaged'
  | 'critical'
  | 'rubble';

export const PRISON_GATE_TEXTURES: Record<PrisonGatePreviewState, string> = {
  intact: '/battles/structures/bramfrit_gate_intact.webp',
  damaged: '/battles/structures/bramfrit_gate_damaged.webp',
  critical: '/battles/structures/bramfrit_gate_critical.webp',
  rubble: '/battles/structures/bramfrit_gate_rubble.webp',
};

export const DEFAULT_PRISON_GATE_VISUAL_LAYOUT: TDStructureVisualLayout = {
  standing: {
    offsetX: 8,
    offsetY: -139,
    width: 260,
    height: 430,
    rotationDegrees: 0,
    skewXDegrees: 0,
    skewYDegrees: 0,
  },
  rubble: {
    offsetX: 8,
    offsetY: -24,
    width: 260,
    height: 174,
    rotationDegrees: 0,
    skewXDegrees: 0,
    skewYDegrees: 0,
  },
  labelOffsetY: -380,
  healthBarOffsetY: -363,
};

const mergeSpriteLayout = (
  fallback: TDStructureSpriteLayout,
  value?: Partial<TDStructureSpriteLayout>
): TDStructureSpriteLayout => ({
  ...fallback,
  ...value,
});

export function resolvePrisonGateVisualLayout(
  value?: Partial<TDStructureVisualLayout>
): TDStructureVisualLayout {
  return {
    ...DEFAULT_PRISON_GATE_VISUAL_LAYOUT,
    ...value,
    standing: mergeSpriteLayout(
      DEFAULT_PRISON_GATE_VISUAL_LAYOUT.standing,
      value?.standing
    ),
    rubble: mergeSpriteLayout(
      DEFAULT_PRISON_GATE_VISUAL_LAYOUT.rubble,
      value?.rubble
    ),
  };
}
