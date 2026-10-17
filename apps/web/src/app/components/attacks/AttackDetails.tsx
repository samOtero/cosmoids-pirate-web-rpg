import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import {
  attackSeconds,
  compareAttacks,
  getAttackInformation,
} from '@/utils/attackInformation';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

function firstSentence(text: string): string {
  return text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
}

/** One selected move; extended rules stay available without expanding every surface. */
export function AttackDetails({
  attack,
  badge,
  intervalMs,
  readiness,
  compareWith,
}: {
  attack: AttackDefinition;
  badge?: string;
  intervalMs?: number;
  readiness?: string;
  compareWith?: AttackDefinition;
}) {
  const info = getAttackInformation(attack);
  const previous = compareWith ? getAttackInformation(compareWith) : undefined;
  const changedValue = (value: string, old?: string) =>
    old && old !== value ? old + ' → ' + value : value;
  const shortCategory = info.category.split(' · ')[0];
  return (
    <section
      aria-label={attack.name + ' details'}
      className="min-h-0 min-w-0 overflow-y-auto rounded border border-cyan-800/70 bg-slate-950/70 p-2 text-left text-xs leading-snug text-slate-200"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="text-sm font-bold text-white">{attack.name}</h3>
        <TypeBadge type={attack.type} />
        {badge && (
          <span className="text-xs font-semibold text-cyan-200">{badge}</span>
        )}
      </div>
      <p className="mt-1 line-clamp-2">{firstSentence(info.summary)}</p>
      <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <div className="flex gap-1">
          <dt className="sr-only">Category</dt>
          <dd>
            {changedValue(shortCategory, previous?.category.split(' · ')[0])}
          </dd>
        </div>
        {info.power && (
          <div className="flex gap-1">
            <dt className="text-slate-400">{info.power.label}</dt>
            <dd>
              {changedValue(
                String(info.power.value),
                previous?.power?.label === info.power.label
                  ? String(previous.power.value)
                  : undefined
              )}
            </dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt className="text-slate-400">
            {intervalMs === undefined ? 'Cooldown' : 'Current cooldown'}
          </dt>
          <dd>
            {changedValue(
              attackSeconds(intervalMs ?? attack.cooldownMs),
              compareWith ? attackSeconds(compareWith.cooldownMs) : undefined
            )}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-slate-400">Reach</dt>
          <dd>{changedValue(info.reach, previous?.reach)}</dd>
        </div>
      </dl>
      {readiness && (
        <p className="mt-1 text-xs font-semibold text-amber-200">{readiness}</p>
      )}
      <details key={attack.id} className="mt-1 text-xs">
        <summary
          aria-label={'More about ' + attack.name}
          className="flex min-h-7 cursor-pointer items-center font-semibold text-cyan-200"
        >
          More ▾
        </summary>
        <div className="space-y-2 border-t border-slate-700 pt-2 leading-relaxed text-slate-300">
          <p>{info.summary}</p>
          <p>
            <strong>Targets:</strong> {info.targeting}
          </p>
          <p>{info.category}</p>
          {info.hasDamage && (
            <p>
              Power is a move’s strength, not HP damage. Actual damage depends
              on the user and target.
            </p>
          )}
          {info.effects.length > 0 && (
            <ul
              aria-label="Effects and conditions"
              className="list-disc space-y-1 pl-4"
            >
              {info.effects.map((effect, index) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          )}
          {compareWith && (
            <AttackComparison previous={compareWith} next={attack} />
          )}
        </div>
      </details>
    </section>
  );
}

export function AttackComparison({
  previous,
  next,
}: {
  previous: AttackDefinition;
  next: AttackDefinition;
}) {
  return (
    <section aria-label="Move comparison" className="text-xs text-amber-100">
      <h3 className="font-bold">What changes</h3>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {compareAttacks(previous, next).map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
    </section>
  );
}
