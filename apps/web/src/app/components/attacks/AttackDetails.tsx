import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import {
  attackSeconds,
  compareAttacks,
  getAttackInformation,
} from '@/utils/attackInformation';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

export function AttackDetails({
  attack,
  badge,
  intervalMs,
  readiness,
}: {
  attack: AttackDefinition;
  badge?: string;
  intervalMs?: number;
  readiness?: string;
}) {
  const info = getAttackInformation(attack);
  return (
    <section
      aria-label={`${attack.name} details`}
      className="min-w-0 rounded-lg border border-cyan-700/50 bg-slate-950/70 p-3 text-left text-sm text-slate-200 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-white">{attack.name}</h3>
        <TypeBadge type={attack.type} />
        {badge && (
          <span className="rounded bg-cyan-900 px-2 py-1 text-xs font-bold text-cyan-100">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 leading-relaxed">{info.summary}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div>
          <dt className="text-slate-400">Role / category</dt>
          <dd>{info.category}</dd>
        </div>
        <div>
          <dt className="text-slate-400">
            {intervalMs === undefined
              ? 'Base time between uses'
              : 'Current time between uses'}
          </dt>
          <dd>{attackSeconds(intervalMs ?? attack.cooldownMs)}</dd>
        </div>
        {info.power && (
          <div>
            <dt className="text-slate-400">{info.power.label}</dt>
            <dd>{info.power.value}</dd>
          </div>
        )}
        <div>
          <dt className="text-slate-400">Reach</dt>
          <dd>{info.reach}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-400">Targets</dt>
          <dd>{info.targeting}</dd>
        </div>
      </dl>
      {info.hasDamage && (
        <p className="mt-2 text-xs text-slate-400">
          Power is a move’s strength, not HP damage. Actual damage depends on
          the user and target.
        </p>
      )}
      {readiness && (
        <p className="mt-2 font-semibold text-amber-200">{readiness}</p>
      )}
      {info.effects.length > 0 && (
        <ul
          aria-label="Effects and conditions"
          className="mt-3 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300 sm:text-sm"
        >
          {info.effects.map((effect, index) => (
            <li key={index}>{effect}</li>
          ))}
        </ul>
      )}
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
    <section
      aria-label="Move comparison"
      className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-3 text-sm text-amber-100"
    >
      <h3 className="font-bold">What changes</h3>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {compareAttacks(previous, next).map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
    </section>
  );
}
