'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import PixiBattlefield from '../tower-defense/PixiBattlefield';
import { TowerButton } from '../tower-defense/TowerButton';
import { ActiveAttackMenu } from '../tower-defense/ActiveAttackMenu';
import { useRunTowerDrag } from './useRunTowerDrag';
import { Button } from '../ui/Button';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import {
  drawStartingMoves,
  getRunAttackDefinition,
  RUN_ATTACK_DEFS,
} from '@/engine/roguelite/attacks/definitions';
import { SpeciesId } from '@/types/definitionIds';
import type { BreathDirection } from '@/engine/roguelite/attacks/RunAttackController';
import StartingMoveChoice from './StartingMoveChoice';
import { drawRunAttackPatterns } from './attackVisuals';
import {
  getRunLaneCount,
  RUN_COINS,
  RUN_PARTNERS,
  RUN_TEAM_LIMIT,
  RUN_WAVES,
} from '@/constants/roguelite';
import {
  RogueliteRun,
  RUN_UPGRADES,
  type RunReward,
} from '@/engine/roguelite/RogueliteRun';

function rewardDetails(reward: RunReward) {
  if (reward.kind === 'upgrade') {
    const upgrade = RUN_UPGRADES[reward.upgrade];
    return {
      name: upgrade.name,
      description: upgrade.description,
      label: upgrade.type ? `${upgrade.type} upgrade` : 'Team upgrade',
    };
  }
  const creature = COSMOID_TEMPLATES[reward.speciesId];
  return {
    name: creature.name,
    description: RUN_PARTNERS.find(
      (partner) => partner.speciesId === reward.speciesId
    )!.role,
    label: 'New partner',
  };
}

export default function RogueliteScreen({ onBack }: { onBack: () => void }) {
  const [run, setRun] = useState<RogueliteRun | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [moveOffer, setMoveOffer] = useState<{
    seed: number;
    moves: number[];
  } | null>(null);

  function selectStarter(speciesId: SpeciesId) {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    if (speciesId === SpeciesId.FUEGUANA)
      setMoveOffer({ seed, moves: drawStartingMoves() });
    else setRun(new RogueliteRun(speciesId, seed));
  }

  if (run)
    return (
      <RunBattle
        key={attempt}
        run={run}
        onBack={onBack}
        onRetry={() => {
          setRun(null);
          setAttempt((value) => value + 1);
        }}
      />
    );

  if (moveOffer)
    return (
      <StartingMoveChoice
        moves={moveOffer.moves}
        onBack={() => setMoveOffer(null)}
        onChoose={(attackId) => {
          setRun(
            new RogueliteRun(SpeciesId.FUEGUANA, moveOffer.seed, attackId)
          );
          setMoveOffer(null);
        }}
      />
    );

  return (
    <div className="h-full overflow-y-auto bg-[#0b252c] text-sand">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 py-6 sm:px-10 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-emerald-300 uppercase">
            Roguelite · Prototype
          </span>
          <Button variant="wood" onClick={onBack}>
            Back
          </Button>
        </div>
        <div className="mt-10 mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold sm:text-5xl">
            A small team. A growing storm.
          </h1>
          <p className="mt-4 leading-relaxed text-sand/70">
            Choose a starter, defend the central stash, and build a team as new
            paths open. Defeat a carrier to rescue its coin. Only coins carried
            off the map are lost.
          </p>
          <p className="mt-3 text-sm text-emerald-200">
            {RUN_WAVES} waves · {RUN_COINS} coins · Up to {RUN_TEAM_LIMIT}{' '}
            partners
          </p>
        </div>
        <h2 className="mb-3 text-lg font-semibold">Choose your starter</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {RUN_PARTNERS.filter((partner) => partner.starter).map((partner) => {
            const creature = COSMOID_TEMPLATES[partner.speciesId];
            const attack = getRunAttackDefinition(partner.attackId);
            return (
              <button
                key={partner.speciesId}
                onClick={() => selectStarter(partner.speciesId)}
                className="group flex cursor-pointer flex-col rounded-2xl border border-emerald-200/20 bg-emerald-100/5 p-6 text-left transition hover:border-amber-200/70 hover:bg-emerald-100/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
              >
                <Image
                  src={creature.iconImg ?? creature.spriteUrl}
                  alt=""
                  width={88}
                  height={88}
                  className="mb-5 h-22 w-22 object-contain transition group-hover:-translate-y-1"
                />
                <span className="text-xs tracking-wider text-emerald-200 uppercase">
                  {attack.type}
                </span>
                <span className="mt-1 text-2xl font-bold">{creature.name}</span>
                <span className="mt-2 text-sm text-amber-200">
                  {partner.speciesId === SpeciesId.FUEGUANA
                    ? 'Choose your first move'
                    : attack.name}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-sand/65">
                  {partner.role}
                </span>
                <span className="mt-6 text-sm font-semibold text-emerald-200">
                  Choose {creature.name} →
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-sand/45">
          Your team and upgrades last for this run. Story and Challenge progress
          stay separate.
        </p>
      </div>
    </div>
  );
}

function RunBattle({
  run,
  onBack,
  onRetry,
}: {
  run: RogueliteRun;
  onBack: () => void;
  onRetry: () => void;
}) {
  const [, render] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [intro, setIntro] = useState<'ready' | 'go' | null>('ready');
  const [confirmExit, setConfirmExit] = useState(false);
  const phase = run.phase;
  const engine = run.engine;
  const interactive = phase === 'preparation' || phase === 'battle';
  const ended = phase === 'won' || phase === 'lost';
  const selectedPartner = engine.roster.find(
    (creature) => creature.id === selected
  );
  const selectedRunMove = selectedPartner
    ? RUN_ATTACK_DEFS[selectedPartner.equippedAttacks[0]]
    : undefined;
  const {
    pixiRef,
    surfaceRef,
    draggingRef,
    preview,
    aim,
    begin,
    consumeClick,
    surfaceEvents,
    setDragging,
  } = useRunTowerDrag();
  const selectedTower = engine.towers.find(
    (tower) => tower.creature.id === selected
  );
  const refresh = () => render((value) => value + 1);

  useEffect(() => {
    run.connect();
    return () => run.destroy();
  }, [run]);

  useEffect(() => {
    if (phase !== 'battle' || paused || confirmExit || selected) return;
    let frame = 0;
    let previous: number | undefined;
    let lastRender = 0;
    function animate(time: number) {
      if (previous !== undefined && !document.hidden && !draggingRef.current)
        run.tick(Math.min(time - previous, 50));
      previous = time;
      if (time - lastRender > 100 || run.phase !== 'battle') {
        render((value) => value + 1);
        lastRender = time;
      }
      if (run.phase === 'battle') frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [run, phase, paused, confirmExit, selected, draggingRef]);

  useEffect(() => {
    if (!intro || paused || confirmExit || selected) return;
    const timer = setTimeout(() => {
      if (intro === 'ready') setIntro('go');
      else {
        run.startWave();
        setIntro(null);
        render((value) => value + 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [run, intro, paused, confirmExit, selected]);

  const carried = engine.captureUnits.filter(
    (coin) => coin.heldByEnemyId
  ).length;
  const minutes = Math.floor(run.elapsedMs / 60000);
  const seconds = String(Math.floor(run.elapsedMs / 1000) % 60).padStart(
    2,
    '0'
  );

  return (
    <div
      ref={surfaceRef}
      {...surfaceEvents}
      className="relative flex h-full min-h-0 touch-none flex-col bg-slate-900 text-sand"
    >
      <header className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-cyan-800 bg-slate-800 px-3 py-2 lg:px-6 lg:py-3">
        <h1 className="hidden font-bold text-cyan-400 sm:block">Roguelite</h1>
        <div className="flex flex-1 items-center justify-end gap-2 text-xs sm:text-sm lg:gap-4">
          <span className="rounded border border-cyan-700/50 bg-slate-900 px-2 py-1 font-mono text-cyan-300">
            Wave {run.wave}/{RUN_WAVES}
          </span>
          <span
            role="status"
            className="rounded border border-amber-800/50 bg-slate-900 px-2 py-1 text-amber-200"
          >
            {run.coins}/{RUN_COINS} coins
            {carried > 0 ? ` · ${carried} carried` : ''}
          </span>
          <span className="hidden font-mono text-slate-400 sm:inline">
            {minutes}:{seconds}
          </span>
          <button
            disabled={!!intro || !interactive || !!selected}
            onClick={() => setPaused((value) => !value)}
            className="rounded bg-cyan-700 px-3 py-1 font-bold text-white hover:bg-cyan-600 disabled:opacity-50 lg:py-2"
          >
            {paused ? 'Start' : 'Pause'}
          </button>
          <button
            onClick={() => (ended ? onBack() : setConfirmExit(true))}
            className="rounded bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-500 lg:py-2"
          >
            Close
          </button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <PixiBattlefield
          key={run.wave}
          ref={pixiRef}
          dragSurfaceRef={surfaceRef}
          engine={engine}
          backgroundUrl={run.level.backgroundUrl}
          fitToScreen
          renderAttackPatterns={(graphics, layout) =>
            drawRunAttackPatterns(
              graphics,
              layout,
              engine,
              !!intro || !!selected
            )
          }
          onMapDrop={(id, x, y) => {
            run.placePartner(id, { x, y });
            refresh();
          }}
          onMapRemove={(id) => {
            run.removePartner(id);
            refresh();
          }}
          onDragStateChange={setDragging}
          getDragState={() => (draggingRef.current ? 'tower' : false)}
        />
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded border border-cyan-800/50 bg-slate-950/85 px-2 py-1 text-[10px] text-emerald-100 sm:text-xs">
          {getRunLaneCount(run.wave)} active{' '}
          {getRunLaneCount(run.wave) === 1 ? 'path' : 'paths'}
          {run.wave === 3
            ? ' · East path open'
            : run.wave === 5
              ? ' · South path open'
              : run.wave === RUN_WAVES
                ? ' · Elite incoming'
                : ''}
        </div>
        {intro ? (
          <div
            role="status"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60"
          >
            <div className="bg-linear-to-br from-yellow-300 to-red-500 bg-clip-text px-6 pb-4 text-center text-6xl font-black text-transparent uppercase italic drop-shadow-[0_0_25px_rgba(255,165,0,0.8)] lg:text-9xl">
              {intro === 'ready' ? 'Ready!' : 'GO!'}
            </div>
          </div>
        ) : null}
        {paused && !selected ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-4xl font-black text-white">
            Paused
          </div>
        ) : null}
      </div>
      <div
        className="relative flex min-h-[90px] shrink-0 items-center gap-2 overflow-x-auto border-t border-cyan-800 bg-slate-800 p-2 lg:min-h-[140px] lg:justify-center lg:gap-4 lg:p-4"
        aria-label="Your team"
      >
        <span className="mr-2 hidden shrink-0 text-xs font-bold text-slate-400 uppercase lg:block">
          Drag to Place:
        </span>
        {engine.roster.map((partner) => {
          const creature = COSMOID_TEMPLATES[partner.speciesId];
          const tower = engine.towers.find(
            (candidate) => candidate.creature.id === partner.id
          );
          const imageUrl = creature.iconImg ?? creature.spriteUrl;
          return (
            <TowerButton
              key={partner.id}
              creature={partner}
              name={creature.name}
              spriteUrl={imageUrl}
              isActive={!!tower}
              displayLevel={partner.level}
              displayXp={partner.xp}
              displayHp={tower?.hp}
              displayMaxHp={tower?.maxHp}
              onClick={() => {
                if (interactive && !consumeClick() && !draggingRef.current)
                  setSelected(partner.id);
              }}
              onPointerDown={(event) => {
                if (interactive)
                  begin(event, {
                    id: partner.id,
                    name: creature.name,
                    imageUrl,
                  });
              }}
            />
          );
        })}
        <span className="ml-2 text-[10px] text-slate-400 sm:text-xs">
          {engine.roster.length}/{RUN_TEAM_LIMIT} partners
          <br />
          Drag to move · Click for moves
        </span>
        {run.rewardHistory.some((reward) => reward.kind === 'upgrade') ? (
          <div
            className="ml-auto flex max-w-64 flex-wrap gap-1"
            aria-label="Run rewards"
          >
            {run.rewardHistory
              .filter((reward) => reward.kind === 'upgrade')
              .map((reward, index) => (
                <span
                  key={`${reward.id}_${index}`}
                  title={rewardDetails(reward).description}
                  className="rounded border border-emerald-200/20 px-2 py-1 text-[10px] text-emerald-200"
                >
                  {rewardDetails(reward).name}
                </span>
              ))}
          </div>
        ) : null}
      </div>
      {selectedPartner ? (
        <>
          <ActiveAttackMenu
            key={selectedPartner.id}
            creature={selectedPartner}
            name={COSMOID_TEMPLATES[selectedPartner.speciesId].name}
            spriteUrl={
              COSMOID_TEMPLATES[selectedPartner.speciesId].iconImg ??
              COSMOID_TEMPLATES[selectedPartner.speciesId].spriteUrl
            }
            isActive={!!selectedTower}
            displayLevel={selectedPartner.level}
            displayXp={selectedPartner.xp}
            displayHp={selectedTower?.hp}
            displayMaxHp={selectedTower?.maxHp}
            tower={selectedTower}
            elapsedTimeMs={engine.elapsedTimeMs}
            frameTimeMs={engine.elapsedTimeMs}
            equippedAttacks={selectedPartner.equippedAttacks}
            activeAttackIndex={
              selectedTower?.selectedAttackIndex ??
              selectedPartner.activeAttackIndex ??
              0
            }
            getAttackDefinition={getRunAttackDefinition}
            activeTargetingMode={
              selectedTower?.targetingMode ??
              engine.playerSelectedTargetingModes[selectedPartner.id] ??
              'first'
            }
            onSelectAttack={(index) => {
              engine.setTowerAttack(selectedPartner.id, index);
              refresh();
            }}
            onSelectTargetingMode={(mode) => {
              engine.setTowerTargetingMode(selectedPartner.id, mode);
              refresh();
            }}
            onClose={() => setSelected(null)}
          />
          {selectedRunMove?.pattern.kind === 'piercing' ? (
            <fieldset className="fixed top-16 right-3 z-[10000] rounded-lg border border-orange-200/25 bg-slate-900/95 p-2">
              <legend className="px-1 text-xs text-orange-200">
                Breath direction
              </legend>
              <div className="flex gap-1">
                {(['up', 'right', 'down', 'left'] as BreathDirection[]).map(
                  (direction) => (
                    <button
                      key={direction}
                      aria-label={`Face ${direction}`}
                      aria-pressed={
                        (engine.attackPatterns.breathDirections.get(
                          selectedPartner.id
                        ) ?? 'left') === direction
                      }
                      onClick={() => {
                        run.setBreathDirection(selectedPartner.id, direction);
                        refresh();
                      }}
                      className="h-8 w-8 cursor-pointer rounded border border-orange-200/25 text-lg text-orange-100 aria-pressed:bg-orange-300/30"
                    >
                      {{ up: '↑', right: '→', down: '↓', left: '←' }[direction]}
                    </button>
                  )
                )}
              </div>
            </fieldset>
          ) : null}
        </>
      ) : null}
      {preview ? (
        <div
          aria-hidden="true"
          data-testid="battle-drag-preview"
          className="pointer-events-none fixed z-[10001]"
          style={{
            left: aim!.x - preview.offsetX,
            top: aim!.y - preview.offsetY,
          }}
        >
          <div className="flex h-16 w-16 scale-105 flex-col items-center justify-center rounded border-2 border-cyan-300 bg-cyan-800 p-1 opacity-80 shadow-[0_0_15px_rgba(34,211,238,0.6)] lg:h-24 lg:w-24">
            <Image
              src={preview.imageUrl}
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 object-contain lg:h-10 lg:w-10"
            />
            <span className="mt-1 text-[9px] font-bold text-cyan-100 uppercase">
              {preview.name}
            </span>
          </div>
        </div>
      ) : null}

      {phase === 'reward' ? (
        <RunOverlay
          title="Choose your next advantage"
          subtitle={`Wave ${run.wave} cleared. Pick one reward for this run.`}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {run.rewards.map((reward) => {
              const details = rewardDetails(reward);
              return (
                <button
                  key={reward.id}
                  onClick={() => {
                    run.chooseReward(reward.id);
                    refresh();
                  }}
                  className="cursor-pointer rounded-xl border border-emerald-200/25 bg-emerald-100/5 p-5 text-left transition hover:border-amber-200 hover:bg-emerald-100/10 focus-visible:outline-2 focus-visible:outline-amber-200"
                >
                  {reward.kind === 'partner' ? (
                    <Image
                      src={
                        COSMOID_TEMPLATES[reward.speciesId].iconImg ??
                        COSMOID_TEMPLATES[reward.speciesId].spriteUrl
                      }
                      alt=""
                      width={56}
                      height={56}
                      className="mb-3 h-14 w-14 object-contain"
                    />
                  ) : (
                    <span
                      className="mb-3 block text-3xl text-amber-200"
                      aria-hidden
                    >
                      ✦
                    </span>
                  )}
                  <span className="block text-xs tracking-wider text-emerald-200 uppercase">
                    {details.label}
                  </span>
                  <span className="mt-2 block text-xl font-semibold">
                    {details.name}
                  </span>
                  <span className="mt-3 block text-sm leading-relaxed text-sand/65">
                    {details.description}
                  </span>
                  <span className="mt-5 block text-sm font-semibold text-amber-200">
                    Choose →
                  </span>
                </button>
              );
            })}
          </div>
        </RunOverlay>
      ) : null}

      {ended ? (
        <RunOverlay
          title={
            phase === 'won'
              ? 'The stash is safe.'
              : 'The last coin slipped away.'
          }
          subtitle={
            phase === 'won'
              ? 'You survived the final wave.'
              : `Your defense held until wave ${run.wave}.`
          }
        >
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            {[
              ['Coins saved', `${run.coins}/${RUN_COINS}`],
              ['Coin rescues', run.totalRescues],
              ['Ally follow-ups', run.totalFollowUps],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/5 px-2 py-4">
                <span className="block text-2xl font-bold text-amber-200">
                  {value}
                </span>
                <span className="text-xs text-sand/60">{label}</span>
              </div>
            ))}
          </div>
          <p className="mb-5 text-sm text-sand/60">
            Run time {minutes}:{seconds} · Seed {run.seed}. Your story party is
            unchanged.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="wood" onClick={onRetry}>
              New run
            </Button>
            <Button variant="wood" onClick={onBack}>
              Choose mode
            </Button>
          </div>
        </RunOverlay>
      ) : null}

      {confirmExit ? (
        <RunOverlay
          title="Leave this run?"
          subtitle="This prototype does not save unfinished runs."
        >
          <div className="flex gap-3">
            <Button variant="wood" onClick={() => setConfirmExit(false)}>
              Keep playing
            </Button>
            <Button variant="wood" onClick={onBack}>
              Leave run
            </Button>
          </div>
        </RunOverlay>
      ) : null}
    </div>
  );
}

function RunOverlay({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(56rem,94vw)] overflow-y-auto rounded-2xl border border-emerald-200/25 bg-[#102b32] p-5 text-sand shadow-2xl backdrop:bg-black/75 sm:p-8"
    >
      <h2 id={titleId} className="text-2xl font-bold">
        {title}
      </h2>
      <p className="mt-2 mb-6 text-sm text-sand/65">{subtitle}</p>
      {children}
    </dialog>
  );
}
