import type { CreatureGender } from '@/types/baseGame';
import { CREATURE_GENDER_LABELS } from '@/utils/creatureGender';

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
  const symbol = gender === 'male' ? '♂' : gender === 'female' ? '♀' : '—';
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`pointer-events-none inline-flex items-center gap-1 rounded bg-black/70 px-1 text-sand ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      {compact ? null : <span aria-hidden="true">{label}</span>}
    </span>
  );
}
