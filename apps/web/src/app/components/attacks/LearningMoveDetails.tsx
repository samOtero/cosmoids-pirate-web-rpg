import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { attackSeconds, getAttackInformation } from '@/utils/attackInformation';
import { ELEMENT_TEXT_COLORS } from '../ui/elementTextColors';

/** Full-width move information shared by the learning and replacement stages. */
export function LearningMoveDetails({
  attack,
  heading,
  compact = false,
}: {
  attack: AttackDefinition;
  heading?: string;
  compact?: boolean;
}) {
  const info = getAttackInformation(attack);
  const summary = info.summary.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? info.summary;
  const description = info.summary.slice(summary.length).trim();
  return (
    <section
      aria-label={attack.name + ' details'}
      className="min-h-0 space-y-1 text-xs leading-snug text-slate-200"
    >
      {heading && (
        <h3 className="text-sm font-bold">
          {heading}{' '}
          <span className={ELEMENT_TEXT_COLORS[attack.type]}>
            {attack.name}
          </span>
        </h3>
      )}
      <div
        className={
          compact
            ? ''
            : 'max-h-[min(10rem,28dvh)] overflow-y-auto overscroll-contain'
        }
      >
        <p className={compact ? 'line-clamp-2' : 'font-medium'}>{summary}</p>
        {!compact && description && (
          <p className="mt-1 text-slate-300">{description}</p>
        )}
      </div>
      <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <div>
          <dt className="sr-only">Category</dt>
          <dd>
            {attack.category === 'physical' ? 'Physical' : 'Special'}
            {!info.hasDamage ? ` · ${info.category}` : ''}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Type</dt>
          <dd className={ELEMENT_TEXT_COLORS[attack.type]}>{attack.type}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-slate-400">{info.power?.label ?? 'Power'}</dt>
          <dd>{info.power?.value ?? '—'}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-slate-400">Range</dt>
          <dd>{info.reach}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-slate-400">Cooldown</dt>
          <dd>{attackSeconds(attack.cooldownMs)}</dd>
        </div>
      </dl>
    </section>
  );
}
