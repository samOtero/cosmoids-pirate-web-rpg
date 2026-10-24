import { Button } from '../ui/Button';
import { RUN_ATTACK_DEFS } from '@/engine/roguelite/attacks/definitions';

const PATTERN_LABELS = {
  cleave: 'Short reach · Cleaving sweeps',
  aimed: 'Long reach · Single target',
  piercing: 'Fixed direction · Piercing stream',
  bomb: 'Quick lobs · Delayed explosions',
};

export default function StartingMoveChoice({
  moves,
  onChoose,
  onBack,
}: {
  moves: readonly number[];
  onChoose: (id: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-[#0b252c] px-5 py-6 text-sand sm:px-10 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-emerald-300 uppercase">
            Fueguana · Starting move
          </span>
          <Button variant="wood" onClick={onBack}>
            Back to starters
          </Button>
        </div>
        <h1 className="mt-10 text-3xl font-bold sm:text-4xl">
          Choose Fueguana&apos;s first move
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-sand/70">
          Two moves are drawn from Fueguana&apos;s four-move pool. Pick one for
          this run. Each has a different attack pattern and placement strategy.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {moves.map((id) => {
            const attack = RUN_ATTACK_DEFS[id];
            return (
              <button
                key={id}
                onClick={() => onChoose(id)}
                className="flex cursor-pointer flex-col rounded-2xl border border-orange-200/25 bg-orange-100/5 p-6 text-left transition hover:border-amber-200 hover:bg-orange-100/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
              >
                <span className="text-xs font-semibold tracking-widest text-orange-200 uppercase">
                  Fire · {PATTERN_LABELS[attack.pattern.kind]}
                </span>
                <PatternPreview kind={attack.pattern.kind} />
                <span className="mt-3 text-2xl font-bold">{attack.name}</span>
                <span className="mt-4 text-sm leading-relaxed text-sand/75">
                  {attack.description}
                </span>
                <span className="mt-4 text-sm leading-relaxed text-emerald-200/85">
                  {attack.placementHint}
                </span>
                <span className="mt-6 text-sm font-semibold text-amber-200">
                  Start with {attack.name} →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PatternPreview({ kind }: { kind: keyof typeof PATTERN_LABELS }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 70"
      className="mt-4 h-18 w-full"
      fill="none"
    >
      <circle cx="30" cy="35" r="8" fill="#7ca38b" />
      {kind === 'cleave' ? (
        <g stroke="#fb923c" strokeWidth="4" strokeLinecap="round">
          <path d="M45 10Q95 35 45 60M58 8Q115 35 58 62" />
        </g>
      ) : kind === 'aimed' ? (
        <g stroke="#fb923c" strokeWidth="3">
          <path d="M45 35H187" strokeDasharray="4 8" />
          <path d="M174 28L195 35L174 42" fill="#fed7aa" />
          <circle cx="215" cy="35" r="10" stroke="#a3b6a0" />
        </g>
      ) : kind === 'piercing' ? (
        <g>
          <path d="M45 35H226" stroke="#ed6429" strokeWidth="14" opacity=".4" />
          <path d="M45 35H226" stroke="#fed7aa" strokeWidth="4" />
          {[105, 155, 205].map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy="35"
              r="9"
              stroke="#a3b6a0"
              strokeWidth="2"
            />
          ))}
        </g>
      ) : (
        <g stroke="#fb923c" strokeWidth="2">
          <path
            d="M40 32Q100-12 151 49M40 32Q125-12 194 49"
            strokeDasharray="4 5"
          />
          <circle cx="151" cy="51" r="13" />
          <circle cx="194" cy="51" r="18" />
          <circle cx="108" cy="15" r="5" fill="#fed7aa" />
        </g>
      )}
    </svg>
  );
}
