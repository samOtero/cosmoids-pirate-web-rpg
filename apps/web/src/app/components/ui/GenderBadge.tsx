import type { CreatureGender } from '@/types/baseGame';
import { CREATURE_GENDER_LABELS } from '@/utils/creatureGender';
import { CREATURE_GENDER_PRESENTATION } from '@/utils/creatureGenderPresentation';

export function GenderBadge({
  gender,
  compact = false,
  className = '',
}: {
  gender: CreatureGender;
  compact?: boolean;
  className?: string;
}) {
  const label = CREATURE_GENDER_LABELS[gender];
  const { symbol, textClass } = CREATURE_GENDER_PRESENTATION[gender];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`pointer-events-none inline-flex items-center gap-1 rounded bg-slate-950/95 px-1 ring-1 ring-white/30 ${textClass} ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      {compact ? null : <span aria-hidden="true">{label}</span>}
    </span>
  );
}
