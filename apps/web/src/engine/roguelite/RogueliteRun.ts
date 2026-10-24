import { TowerDefenseEngine } from '../tower-defense/TowerDefenseEngine';
import { getRunAttackDefinition } from './attacks/definitions';
import {
  RunAttackController,
  type BreathDirection,
} from './attacks/RunAttackController';
import type { TDEvent } from '../tower-defense/events/TDEventBus';
import type { Enemy, Point, TDLevelData, Tower } from '../tower-defense/types';
import { ElementType, type PlayerCreature } from '@/types/baseGame';
import type { AttackId, SpeciesId } from '@/types/definitionIds';
import {
  createRunCreature,
  createRunLevel,
  RUN_COINS,
  RUN_PARTNERS,
  RUN_POSITIONS,
  RUN_TEAM_LIMIT,
  RUN_WAVES,
} from '@/constants/roguelite';

export type RunUpgrade =
  | 'backwash'
  | 'openings'
  | 'stoke'
  | 'practice'
  | 'watch';
export const RUN_UPGRADES: Record<
  RunUpgrade,
  {
    name: string;
    description: string;
    type?: ElementType;
    repeatable?: boolean;
  }
> = {
  backwash: {
    name: 'Backwash',
    type: ElementType.WATER,
    description:
      'Water hits push their target against its movement. Each enemy can be pushed once every 2 seconds.',
  },
  openings: {
    name: 'Helping Vines',
    type: ElementType.GRASS,
    description:
      'Grass hits set up an opening for 3 seconds. The next hit from a different partner deals 40% extra damage.',
  },
  stoke: {
    name: 'Stoke the Flame',
    type: ElementType.FIRE,
    description:
      'Successive Fire hits gain 10% damage, up to 40%. The bonus resets after 3 seconds without a Fire hit.',
  },
  practice: {
    name: 'Team Practice',
    repeatable: true,
    description:
      'All partners gain 15% Attack and Special Attack for this run. Can be picked again.',
  },
  watch: {
    name: 'Shared Watch',
    repeatable: true,
    description:
      'All partners gain 10% attack reach for this run. Can be picked again.',
  },
};
export type RunReward =
  | { id: string; kind: 'partner'; speciesId: SpeciesId }
  | { id: string; kind: 'upgrade'; upgrade: RunUpgrade };
export type RunPhase = 'preparation' | 'battle' | 'reward' | 'won' | 'lost';

/** Only this engine changes objective recovery. Ordinary battles keep floor drops. */
export class RogueliteBattleEngine extends TowerDefenseEngine {
  public rescuedCoins = 0;
  public readonly attackPatterns: RunAttackController;

  constructor(
    level: Pick<TDLevelData, 'paths' | 'placementSpots'> & Partial<TDLevelData>,
    roster: PlayerCreature[] = [],
    directions = new Map<string, BreathDirection>()
  ) {
    super(level, roster);
    this.attackPatterns = new RunAttackController(this, directions);
  }

  override getAttackDefinition(id: AttackId) {
    return getRunAttackDefinition(id);
  }

  protected override updateCustomTowerAttack(tower: Tower): boolean {
    return this.attackPatterns.updateTower(tower);
  }

  protected override updateCustomProjectiles(deltaMs: number) {
    this.attackPatterns.tick(deltaMs);
  }

  override dropCaptureUnit(enemy: Enemy) {
    const objective = super.dropCaptureUnit(enemy);
    if (objective && !objective.heldByEnemyId) {
      objective.position = { ...objective.homePosition };
      objective.returnHomeAvailableAtMs = undefined;
      this.rescuedCoins++;
      this.floatingTexts.push({
        id: `rescue_${objective.id}_${this.rescuedCoins}`,
        text: 'Coin rescued!',
        position: { ...objective.homePosition },
        color: 0xfde68a,
        durationMs: 1200,
        elapsedMs: 0,
      });
    }
    return objective;
  }

  override placeTower(creatureId: string, x: number, y: number) {
    const placed = super.placeTower(creatureId, x, y);
    // Reward drafting owns progression here. No XP, learning, or evolution dialogs.
    this.towers.forEach((tower) => {
      tower.receivesExperience = false;
    });
    return placed;
  }
}

/** Run-only on-hit modifiers. Never writes to the shared attack registry. */
export class RunCombatEffects {
  private openings = new Map<string, { sourceId: string; until: number }>();
  private lastPush = new Map<string, number>();
  private heat = new Map<string, { hits: number; lastHit: number }>();
  public followUps = 0;
  private unsubscribe?: () => void;

  constructor(
    private engine: TowerDefenseEngine,
    private upgrades: ReadonlySet<RunUpgrade>,
    private getAttackType: (id: AttackId) => ElementType | undefined = (id) =>
      getRunAttackDefinition(id)?.type
  ) {
    this.connect();
  }

  connect() {
    this.unsubscribe ??= this.engine.events.subscribe((event) =>
      this.handleEvent(event)
    );
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private handleEvent(event: TDEvent) {
    if (event.type === 'ENEMY_DIED') {
      this.openings.delete(event.enemyId);
      this.lastPush.delete(event.enemyId);
      return;
    }
    if (event.type !== 'ATTACK_DAMAGE_DEALT' || event.damage <= 0) return;
    const target = this.engine.enemies.find(
      (enemy) => enemy.id === event.targetEnemyId
    );
    if (!target || target.isInvulnerable) return;
    const now = this.engine.elapsedTimeMs;
    const type = this.getAttackType(event.attackDefId);
    let bonus = 0;
    // A finishing Fire hit still sustains escalation for the next target.
    if (this.upgrades.has('stoke') && type === ElementType.FIRE) {
      const heat = this.heat.get(event.towerId);
      const hits =
        heat && now - heat.lastHit < 3000 ? Math.min(4, heat.hits + 1) : 0;
      this.heat.set(event.towerId, { hits, lastHit: now });
      bonus += hits * 0.1;
    }
    if (target.hp <= 0) return;
    const opening = this.openings.get(target.id);
    if (opening && opening.until > now && opening.sourceId !== event.towerId) {
      bonus += 0.4;
      this.openings.delete(target.id);
      this.followUps++;
      this.text(target.position, 'Follow-up!', 0xbef264);
    }
    if (bonus > 0) {
      const damage = Math.max(1, Math.floor(event.damage * bonus));
      target.hp = Math.max(0, target.hp - damage);
      this.text(target.position, `+${damage}`, 0xfbbf24);
      // The attack's normal resolver observes the updated HP and emits defeat once.
    }
    if (target.hp <= 0) return;
    if (this.upgrades.has('openings') && type === ElementType.GRASS) {
      this.openings.set(target.id, {
        sourceId: event.towerId,
        until: now + 3000,
      });
      this.text(target.position, 'Opening', 0x86efac);
    }
    if (
      this.upgrades.has('backwash') &&
      type === ElementType.WATER &&
      now - (this.lastPush.get(target.id) ?? -Infinity) >= 2000
    ) {
      this.engine.pushEnemyAgainstMovement(target, 7);
      this.lastPush.set(target.id, now);
      this.text(target.position, 'Backwash', 0x7dd3fc);
    }
  }

  private text(position: Point, text: string, color: number) {
    this.engine.floatingTexts.push({
      id: `run_effect_${this.engine.floatingTexts.length}_${this.engine.elapsedTimeMs}`,
      text,
      color,
      position: { ...position },
      durationMs: 850,
      elapsedMs: 0,
      scale: 0.8,
    });
  }
}

export class RogueliteRun {
  public phase: RunPhase = 'preparation';
  public wave = 1;
  public coins = RUN_COINS;
  public engine!: RogueliteBattleEngine;
  public level!: TDLevelData;
  public upgrades = new Set<RunUpgrade>();
  public rewards: RunReward[] = [];
  public rewardHistory: RunReward[] = [];
  public elapsedMs = 0;
  public rescuedCoins = 0;
  public followUps = 0;
  private effects!: RunCombatEffects;
  private practiceStacks = 0;
  private watchStacks = 0;
  private randomState: number;
  private serial = 0;
  private breathDirections = new Map<string, BreathDirection>();
  private trainedTowers = new WeakSet<Tower>();

  constructor(
    starter: SpeciesId,
    public readonly seed: number,
    startingAttack?: AttackId
  ) {
    if (
      !RUN_PARTNERS.some(
        (partner) => partner.starter && partner.speciesId === starter
      )
    ) {
      throw new Error('Invalid run starter');
    }
    this.randomState = seed >>> 0;
    this.prepareBattle([
      createRunCreature(starter, ++this.serial, startingAttack),
    ]);
  }

  private prepareBattle(
    roster: typeof this.engine.roster,
    positions?: { id: string; position: Point }[],
    newPartnerId?: string
  ) {
    this.level = createRunLevel(this.wave, this.coins);
    this.engine = new RogueliteBattleEngine(
      this.level,
      roster,
      this.breathDirections
    );
    this.engine.towerRangeMultiplier = 1 + this.watchStacks * 0.1;
    this.effects = new RunCombatEffects(this.engine, this.upgrades);
    this.engine.roster.forEach((creature, index) => {
      const previous = positions?.find((entry) => entry.id === creature.id);
      if (positions && !previous && creature.id !== newPartnerId) return;
      const spot =
        previous?.position ??
        RUN_POSITIONS.find(
          (candidate) => !this.engine.isSpotOccupied(candidate.x, candidate.y)
        ) ??
        RUN_POSITIONS[index];
      this.engine.placeTower(creature.id, spot.x, spot.y);
    });
    this.applyTraining();
    this.phase = 'preparation';
  }

  private applyTraining() {
    for (const tower of this.engine.towers) {
      if (this.trainedTowers.has(tower)) continue;
      const multiplier = 1 + this.practiceStacks * 0.15;
      tower.currentAttack *= multiplier;
      tower.currentSpecialAttack *= multiplier;
      this.trainedTowers.add(tower);
    }
  }

  public placePartner(id: string, position: Point): boolean {
    if (
      (this.phase !== 'preparation' && this.phase !== 'battle') ||
      !this.engine.placementSpots.some(
        (spot) => spot.x === position.x && spot.y === position.y
      )
    )
      return false;
    const placed = this.engine.placeTower(id, position.x, position.y);
    this.applyTraining();
    return placed;
  }

  public removePartner(id: string): boolean {
    if (this.phase !== 'preparation' && this.phase !== 'battle') return false;
    return this.engine.removeTower(id);
  }

  public startWave(): boolean {
    if (this.phase !== 'preparation') return false;
    this.phase = 'battle';
    return true;
  }

  public setBreathDirection(
    creatureId: string,
    direction: BreathDirection
  ): boolean {
    if (
      (this.phase !== 'preparation' && this.phase !== 'battle') ||
      !this.engine.roster.some((creature) => creature.id === creatureId)
    )
      return false;
    this.breathDirections.set(creatureId, direction);
    return true;
  }

  public tick(deltaMs: number) {
    if (this.phase !== 'battle' || !Number.isFinite(deltaMs) || deltaMs <= 0)
      return;
    this.elapsedMs += deltaMs;
    // Simulation time, rather than wall time, makes pausing safe for spawners.
    this.engine.tick(this.engine.elapsedTimeMs + deltaMs, deltaMs);
    this.coins = Math.max(0, this.engine.lives);
    if (this.coins === 0) this.phase = 'lost';
    else if (
      this.engine.hasFinishedAllWaves &&
      this.engine.enemies.length === 0
    ) {
      this.phase = this.wave === RUN_WAVES ? 'won' : 'reward';
      if (this.phase === 'reward') this.rewards = this.draftRewards();
    }
  }

  private random(): number {
    this.randomState =
      (Math.imul(1664525, this.randomState) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swap = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    return shuffled;
  }

  private draftRewards(): RunReward[] {
    const roster = this.engine.roster;
    const partners: RunReward[] =
      roster.length >= RUN_TEAM_LIMIT
        ? []
        : RUN_PARTNERS.filter(
            (partner) =>
              !roster.some(
                (creature) => creature.speciesId === partner.speciesId
              )
          ).map((partner) => ({
            id: `partner_${partner.speciesId}`,
            kind: 'partner',
            speciesId: partner.speciesId,
          }));
    if (this.wave === 1) return this.shuffle(partners).slice(0, 3);
    const upgrades: RunReward[] = (Object.keys(RUN_UPGRADES) as RunUpgrade[])
      .filter(
        (id) =>
          RUN_UPGRADES[id].repeatable ||
          (!this.upgrades.has(id) &&
            roster.some((creature) =>
              creature.equippedAttacks.some(
                (attackId) =>
                  getRunAttackDefinition(attackId)?.type ===
                  RUN_UPGRADES[id].type
              )
            ))
      )
      .map((upgrade) => ({
        id: `upgrade_${upgrade}`,
        kind: 'upgrade',
        upgrade,
      }));
    const shuffledPartners = this.shuffle(partners);
    const shuffledUpgrades = this.shuffle(upgrades);
    // Keep a recruitment option while room remains, and an applicable upgrade.
    return [
      ...shuffledPartners.slice(0, 1),
      ...shuffledUpgrades.slice(0, 1),
      ...this.shuffle([
        ...shuffledPartners.slice(1),
        ...shuffledUpgrades.slice(1),
      ]),
    ].slice(0, 3);
  }

  public chooseReward(id: string): boolean {
    if (this.phase !== 'reward') return false;
    const reward = this.rewards.find((candidate) => candidate.id === id);
    if (!reward) return false;
    const roster = this.engine.roster.map((creature) => ({
      ...creature,
      equippedAttacks: [...creature.equippedAttacks],
    }));
    const positions = this.engine.towers.map((tower) => ({
      id: tower.creature.id,
      position: { ...tower.position },
    }));
    let newPartnerId: string | undefined;
    if (reward.kind === 'partner') {
      const partner = createRunCreature(reward.speciesId, ++this.serial);
      newPartnerId = partner.id;
      roster.push(partner);
    } else {
      this.upgrades.add(reward.upgrade);
      if (reward.upgrade === 'practice') this.practiceStacks++;
      if (reward.upgrade === 'watch') this.watchStacks++;
    }
    this.rewardHistory.push(reward);
    this.rescuedCoins += this.engine.rescuedCoins;
    this.followUps += this.effects.followUps;
    this.effects.destroy();
    this.engine.destroy();
    this.wave++;
    this.rewards = [];
    this.prepareBattle(roster, positions, newPartnerId);
    this.startWave();
    return true;
  }

  get totalRescues() {
    return this.rescuedCoins + this.engine.rescuedCoins;
  }
  get totalFollowUps() {
    return this.followUps + this.effects.followUps;
  }

  public connect() {
    this.effects.connect();
  }

  public destroy() {
    this.effects.destroy();
    this.engine.destroy();
  }
}
