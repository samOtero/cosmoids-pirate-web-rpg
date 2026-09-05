'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import PixiBattlefield from '@/app/components/tower-defense/PixiBattlefield';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { FIRST_LEVEL } from '@/constants/tdLevels/firstLevel';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

const PRIMARY_TARGET_ID = 'attack-preview-primary-target';
const PREVIEW_TOWER_POSITION = { x: 42, y: 50 };
const AOE_TARGET_CLUSTER_CENTER = { x: 62, y: 50 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface EnemyPreviewConfig {
  id: string;
  creatureId: string;
  level: number;
  abilityId: string;
}

interface DamageStats {
  last: number;
  total: number;
  hits: number;
}

const creatureOptions = Object.values(COSMOID_TEMPLATES).sort((a, b) =>
  a.name.localeCompare(b.name)
);
const attackOptions = Object.values(ATTACK_DEFS).sort((a, b) =>
  a.name.localeCompare(b.name)
);
const abilityOptions = Object.values(ENEMY_ABILITY_DEFS).sort((a, b) =>
  a.id.localeCompare(b.id)
);

const fieldClass =
  'w-full rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400';
const buttonClass =
  'rounded border border-cyan-700 bg-cyan-950 px-3 py-1.5 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40';

function clampLevel(value: number) {
  return Math.max(1, Math.min(100, Number.isFinite(value) ? value : 1));
}

function armWindGustTarget(engine: TowerDefenseEngine) {
  const target = engine.enemies.find((enemy) => enemy.id === PRIMARY_TARGET_ID);
  if (
    !target ||
    target.heldCaptureUnitId ||
    (target.itemPickupBlockedUntilMs ?? 0) > engine.elapsedTimeMs
  ) {
    return;
  }

  const itemId = 'attack-preview-carried-item';
  let item = engine.captureUnits.find((unit) => unit.id === itemId);
  if (!item) {
    item = {
      id: itemId,
      tdConfigId: 'coin_1',
      position: { ...target.position },
      homePosition: { ...target.position },
      facingDirection: 'left',
      hp: 1,
      maxHp: 1,
    };
    engine.captureUnits.push(item);
  }

  target.hasBeenWindDisarmed = false;
  target.heldCaptureUnitId = item.id;
  item.heldByEnemyId = target.id;
  item.position = { ...target.position };
}

function getAdditionalEnemyPosition(index: number) {
  const angle = index * GOLDEN_ANGLE - Math.PI / 2;
  const radius = 10 + (index % 3) * 4;
  return {
    x: AOE_TARGET_CLUSTER_CENTER.x + Math.cos(angle) * radius,
    y: AOE_TARGET_CLUSTER_CENTER.y + Math.sin(angle) * radius,
  };
}

function createEngine(
  towerCreatureId: string,
  towerLevel: number,
  targetCreatureId: string,
  targetLevel: number,
  targetAbilityId: string,
  additionalEnemies: EnemyPreviewConfig[],
  showNearbyAlly: boolean
) {
  const towerCreature = {
    id: 'attack-preview-tower',
    speciesId: towerCreatureId,
    level: towerLevel,
    xp: 0,
    // Sandbox loadout: selecting a move uses production swapping, not a new battle.
    equippedAttacks: attackOptions.map((attack) => attack.id),
    activeAttackIndex: attackOptions.findIndex(
      (attack) => attack.id === 'EMBER'
    ),
    targetingMode: 'closest',
    isShiny: false,
  };
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [{ ...PREVIEW_TOWER_POSITION }],
      waveEnemyDefinitions: [],
      waves: [{ id: 'attack-preview', groups: [] }],
      disableCapture: true,
      backgroundUrl: FIRST_LEVEL.backgroundUrl,
      backgroundScale: FIRST_LEVEL.backgroundScale,
    },
    [
      towerCreature,
      ...(showNearbyAlly
        ? [
            {
              id: 'attack-preview-ally',
              speciesId: 'starter_crab',
              level: towerLevel,
              xp: 0,
              equippedAttacks: ['VINE_WHIP'],
              activeAttackIndex: 0,
              isShiny: false,
            },
          ]
        : []),
    ]
  );

  engine.placeTower(
    towerCreature.id,
    PREVIEW_TOWER_POSITION.x,
    PREVIEW_TOWER_POSITION.y
  );
  if (showNearbyAlly) engine.placeTower('attack-preview-ally', 52, 39);
  engine.spawnPreviewEnemy({
    id: PRIMARY_TARGET_ID,
    creatureId: targetCreatureId,
    level: targetLevel,
    position: { x: 60, y: 50 },
    abilityId: targetAbilityId || undefined,
    isInvulnerable: true,
  });

  additionalEnemies.forEach((enemy, index) => {
    engine.spawnPreviewEnemy({
      id: enemy.id,
      creatureId: enemy.creatureId,
      level: enemy.level,
      position: getAdditionalEnemyPosition(index),
      abilityId: enemy.abilityId || undefined,
      isInvulnerable: true,
    });
  });

  return engine;
}

function AbilitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label="Enemy ability"
      className={fieldClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">No enemy ability</option>
      {abilityOptions.map((ability) => (
        <option key={ability.id} value={ability.id}>
          {ability.id}
        </option>
      ))}
    </select>
  );
}

export default function TDAttackPreview({ onClose }: { onClose: () => void }) {
  const [towerCreatureId, setTowerCreatureId] = useState('starter_iguana');
  const [towerLevel, setTowerLevel] = useState(10);
  const [towerAttackId, setTowerAttackId] = useState('EMBER');
  const [showNearbyAlly, setShowNearbyAlly] = useState(false);
  const [targetCreatureId, setTargetCreatureId] = useState('mouse_1');
  const [targetLevel, setTargetLevel] = useState(10);
  const [targetAbilityId, setTargetAbilityId] = useState('');
  const [additionalEnemies, setAdditionalEnemies] = useState<
    EnemyPreviewConfig[]
  >([]);
  const [isRunning, setIsRunning] = useState(true);
  const [abilityMessage, setAbilityMessage] = useState('');
  const nextEnemyId = useRef(1);

  const engine = useMemo(
    () =>
      createEngine(
        towerCreatureId,
        towerLevel,
        targetCreatureId,
        targetLevel,
        targetAbilityId,
        additionalEnemies,
        showNearbyAlly
      ),
    [
      towerCreatureId,
      towerLevel,
      targetCreatureId,
      targetLevel,
      targetAbilityId,
      additionalEnemies,
      showNearbyAlly,
    ]
  );
  const [damageSample, setDamageSample] = useState<
    DamageStats & { engine: TowerDefenseEngine | null }
  >({ engine: null, last: 0, total: 0, hits: 0 });
  const damageStats: DamageStats =
    damageSample.engine === engine
      ? damageSample
      : { last: 0, total: 0, hits: 0 };

  useEffect(() => () => engine.destroy(), [engine]);

  useEffect(() => {
    engine.setTowerAttack(
      'attack-preview-tower',
      attackOptions.findIndex((attack) => attack.id === towerAttackId)
    );
    if (towerAttackId === 'WIND_GUST') armWindGustTarget(engine);
  }, [engine, towerAttackId]);

  useEffect(() => {
    return engine.events.subscribe((event) => {
      if (
        event.type === 'ATTACK_DAMAGE_DEALT' &&
        event.targetEnemyId === PRIMARY_TARGET_ID
      ) {
        setDamageSample((current) => {
          const previous =
            current.engine === engine
              ? current
              : { last: 0, total: 0, hits: 0 };
          return {
            engine,
            last: event.damage,
            total: previous.total + event.damage,
            hits: previous.hits + 1,
          };
        });
      }
    });
  }, [engine]);

  useEffect(() => {
    if (!isRunning) return;

    let animationFrame = 0;
    let previousTime: number | null = null;
    const animate = (time: number) => {
      if (previousTime !== null) {
        engine.tick(time, Math.min(time - previousTime, 50));
        if (towerAttackId === 'WIND_GUST') {
          armWindGustTarget(engine);
        }
      }
      previousTime = time;
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [engine, isRunning, towerAttackId]);

  const triggerAbility = (enemyId: string) => {
    const triggered = engine.triggerEnemyAbility(enemyId);
    setAbilityMessage(
      triggered
        ? 'Ability triggered.'
        : 'This ability needs another enemy actor on the field.'
    );
  };

  const activeAttack = ATTACK_DEFS[towerAttackId];
  const averageDamage =
    damageStats.hits > 0 ? damageStats.total / damageStats.hits : 0;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-900 bg-slate-900 px-4 py-2 shadow-lg">
        <div>
          <h1 className="text-lg font-black tracking-wide text-cyan-300">
            Attack &amp; Ability Lab
          </h1>
          <p className="text-xs text-slate-400">
            Production battlefield rendering with stationary, immortal targets.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            onClick={() => setIsRunning((current) => !current)}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            className="rounded bg-red-700 px-3 py-1.5 text-sm font-bold hover:bg-red-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-[42vh] flex-1 bg-black">
          <PixiBattlefield
            engine={engine}
            backgroundUrl={FIRST_LEVEL.backgroundUrl}
            backgroundScale={FIRST_LEVEL.backgroundScale}
            onMapDrop={() => undefined}
            onMapRemove={() => undefined}
          />
          {!isRunning && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1 text-xs font-black tracking-widest text-amber-300 uppercase">
              Paused
            </div>
          )}
        </main>

        <aside className="w-full shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-900 p-3 lg:w-[390px]">
          <section className="mb-3 rounded-lg border border-cyan-900 bg-slate-800/80 p-3">
            <h2 className="mb-2 text-xs font-black tracking-wider text-cyan-300 uppercase">
              Tower unit
            </h2>
            <div className="grid grid-cols-[1fr_72px] gap-2">
              <select
                aria-label="Tower creature"
                className={fieldClass}
                value={towerCreatureId}
                onChange={(event) => setTowerCreatureId(event.target.value)}
              >
                {creatureOptions.map((creature) => (
                  <option key={creature.id} value={creature.id}>
                    {creature.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Tower level"
                className={fieldClass}
                type="number"
                min={1}
                max={100}
                value={towerLevel}
                onChange={(event) =>
                  setTowerLevel(clampLevel(event.target.valueAsNumber))
                }
              />
            </div>
            <label className="mt-2 block text-[11px] font-bold text-slate-400 uppercase">
              Active attack
              <select
                className={`${fieldClass} mt-1`}
                value={towerAttackId}
                onChange={(event) => setTowerAttackId(event.target.value)}
              >
                {attackOptions.map((attack) => (
                  <option key={attack.id} value={attack.id}>
                    {attack.name} ({attack.id})
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
              <Stat label="Power" value={activeAttack.power} />
              <Stat label="Type" value={activeAttack.type} />
              <Stat label="Class" value={activeAttack.category} />
              <Stat label="CD" value={`${activeAttack.cooldownMs}ms`} />
            </div>
            {activeAttack.supportBuff && (
              <p className="mt-2 text-xs text-amber-200">
                +
                {Math.round(
                  (activeAttack.supportBuff.attackSpeedMultiplier - 1) * 100
                )}
                % attack speed for {activeAttack.supportBuff.durationMs / 1000}
                s. Buffs self and nearby allies.
              </p>
            )}
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showNearbyAlly}
                onChange={(event) => setShowNearbyAlly(event.target.checked)}
              />
              Show nearby ally
            </label>
            {activeAttack.repairSupport && (
              <div className="mt-2 space-y-2 text-xs text-emerald-200">
                <p>
                  Heals 20% max HP and grants +25% physical defense. Repairs the
                  lowest HP percentage first, then reinforces allies before self.
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded border border-emerald-800 px-2 py-1"
                    onClick={() => {
                      const tower = engine.towers.find(
                        (unit) => unit.creature.id === 'attack-preview-tower'
                      );
                      if (tower) tower.hp = tower.maxHp * 0.4;
                    }}
                  >
                    Injure caster
                  </button>
                  <button
                    className="rounded border border-emerald-800 px-2 py-1 disabled:opacity-40"
                    disabled={!showNearbyAlly}
                    onClick={() => {
                      const ally = engine.towers.find(
                        (unit) => unit.creature.id === 'attack-preview-ally'
                      );
                      if (ally) ally.hp = ally.maxHp * 0.4;
                    }}
                  >
                    Injure ally
                  </button>
                </div>
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              Attack swaps keep buffs and cooldowns. Changing actors resets the
              preview.
            </p>
          </section>

          <section className="mb-3 rounded-lg border border-emerald-900 bg-slate-800/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-black tracking-wider text-emerald-300 uppercase">
                Immortal target
              </h2>
              <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                HP LOCKED
              </span>
            </div>
            <div className="grid grid-cols-[1fr_72px] gap-2">
              <select
                aria-label="Target creature"
                className={fieldClass}
                value={targetCreatureId}
                onChange={(event) => setTargetCreatureId(event.target.value)}
              >
                {creatureOptions.map((creature) => (
                  <option key={creature.id} value={creature.id}>
                    {creature.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Target level"
                className={fieldClass}
                type="number"
                min={1}
                max={100}
                value={targetLevel}
                onChange={(event) =>
                  setTargetLevel(clampLevel(event.target.valueAsNumber))
                }
              />
            </div>
            <div className="mt-2 flex gap-2">
              <AbilitySelect
                value={targetAbilityId}
                onChange={setTargetAbilityId}
              />
              <button
                className={`${buttonClass} shrink-0`}
                disabled={!targetAbilityId}
                onClick={() => triggerAbility(PRIMARY_TARGET_ID)}
              >
                Trigger
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
              <Stat label="Last" value={damageStats.last || '—'} />
              <Stat
                label="Average"
                value={damageStats.hits ? averageDamage.toFixed(1) : '—'}
              />
              <Stat label="Hits" value={damageStats.hits} />
              <Stat label="Total" value={damageStats.total} />
            </div>
            <button
              className="mt-2 text-xs font-bold text-slate-400 underline hover:text-white"
              onClick={() =>
                setDamageSample({ engine, last: 0, total: 0, hits: 0 })
              }
            >
              Reset damage sample
            </button>
          </section>

          <section className="rounded-lg border border-violet-900 bg-slate-800/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-black tracking-wider text-violet-300 uppercase">
                Additional enemies
              </h2>
              <button
                className={buttonClass}
                onClick={() => {
                  const id = `attack-preview-extra-${nextEnemyId.current++}`;
                  setAdditionalEnemies((current) => [
                    ...current,
                    {
                      id,
                      creatureId: 'bettle',
                      level: 10,
                      abilityId: '',
                    },
                  ]);
                }}
              >
                + Spawn
              </button>
            </div>

            {additionalEnemies.length === 0 ? (
              <p className="rounded bg-slate-950/60 p-2 text-xs text-slate-400">
                Add actors inside the tower&apos;s standard area radius to
                preview AOE attacks or ally-targeting abilities such as
                Tailwind.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {additionalEnemies.map((enemy, index) => (
                  <div
                    key={enemy.id}
                    className="rounded border border-slate-700 bg-slate-950/60 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-400 uppercase">
                        Enemy {index + 1}
                      </span>
                      <button
                        className="text-xs font-bold text-red-400 hover:text-red-300"
                        onClick={() =>
                          setAdditionalEnemies((current) =>
                            current.filter((item) => item.id !== enemy.id)
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_72px] gap-2">
                      <select
                        aria-label={`Enemy ${index + 1} creature`}
                        className={fieldClass}
                        value={enemy.creatureId}
                        onChange={(event) =>
                          setAdditionalEnemies((current) =>
                            current.map((item) =>
                              item.id === enemy.id
                                ? { ...item, creatureId: event.target.value }
                                : item
                            )
                          )
                        }
                      >
                        {creatureOptions.map((creature) => (
                          <option key={creature.id} value={creature.id}>
                            {creature.name}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label={`Enemy ${index + 1} level`}
                        className={fieldClass}
                        type="number"
                        min={1}
                        max={100}
                        value={enemy.level}
                        onChange={(event) =>
                          setAdditionalEnemies((current) =>
                            current.map((item) =>
                              item.id === enemy.id
                                ? {
                                    ...item,
                                    level: clampLevel(
                                      event.target.valueAsNumber
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <AbilitySelect
                        value={enemy.abilityId}
                        onChange={(abilityId) =>
                          setAdditionalEnemies((current) =>
                            current.map((item) =>
                              item.id === enemy.id
                                ? { ...item, abilityId }
                                : item
                            )
                          )
                        }
                      />
                      <button
                        className={`${buttonClass} shrink-0`}
                        disabled={!enemy.abilityId}
                        onClick={() => triggerAbility(enemy.id)}
                      >
                        Trigger
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {abilityMessage && (
              <p className="mt-2 text-xs font-semibold text-amber-300">
                {abilityMessage}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded bg-slate-950 px-1 py-1.5">
      <div className="truncate font-black text-white capitalize">{value}</div>
      <div className="text-[9px] font-bold text-slate-500 uppercase">
        {label}
      </div>
    </div>
  );
}
