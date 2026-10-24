import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Point, Tower } from '@/engine/tower-defense/types';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { getAttackSpeedMultiplier } from '@/engine/tower-defense/attackSpeedModifiers';
import { RUN_ATTACK_DEFS, type RunAttackDefinition } from './definitions';

export type BreathDirection = 'up' | 'right' | 'down' | 'left';
export const BREATH_ANGLES: Record<BreathDirection, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};
export interface RunAttackVisual {
  id: string;
  kind: 'claw' | 'breath' | 'bomb' | 'blast';
  position: Point;
  origin: Point;
  angle: number;
  radius: number;
  progress: number;
  flightProgress?: number;
  side?: number;
  landing?: Point;
}
interface TimedVisual extends RunAttackVisual {
  ageMs: number;
  durationMs: number;
}
interface Shot {
  id: string;
  attack: RunAttackDefinition;
  source: Tower;
  origin: Point;
  position: Point;
  destination: Point;
  angle: number;
  ageMs: number;
  range: number;
  distance: number;
  hitIds: Set<string>;
}
interface AttackTurn {
  nextSlot: number;
  busyUntil: number;
  casts: number;
}

export class RunAttackController {
  public shots: Shot[] = [];
  private turns = new Map<string, AttackTurn>();
  private effects: TimedVisual[] = [];
  private serial = 0;

  constructor(
    private engine: TowerDefenseEngine,
    public readonly breathDirections = new Map<string, BreathDirection>(),
    private definitions: Readonly<
      Record<number, RunAttackDefinition>
    > = RUN_ATTACK_DEFS
  ) {}

  private vector(from: Point, to: Point): Point {
    return {
      x:
        (to.x - from.x) * this.engine.aspectRatio * this.engine.backgroundScale,
      y: (to.y - from.y) * this.engine.backgroundScale,
    };
  }

  private offset(origin: Point, angle: number, distance: number): Point {
    return {
      x:
        origin.x +
        (Math.cos(angle) * distance) /
          (this.engine.aspectRatio * this.engine.backgroundScale),
      y: origin.y + (Math.sin(angle) * distance) / this.engine.backgroundScale,
    };
  }

  private direction(source: Tower): BreathDirection {
    return this.breathDirections.get(source.creature.id) ?? 'left';
  }

  private inCorridor(
    enemy: Enemy,
    origin: Point,
    angle: number,
    range: number,
    width: number
  ): boolean {
    const vector = this.vector(origin, enemy.position);
    const along = vector.x * Math.cos(angle) + vector.y * Math.sin(angle);
    const across = Math.abs(
      vector.x * -Math.sin(angle) + vector.y * Math.cos(angle)
    );
    return along >= 0 && along <= range && across <= width;
  }

  /** One cast at a time, rotating through ready moves; traveling effects persist. */
  public updateTower(source: Tower): boolean {
    const moves = source.equippedAttacksRuntime;
    if (!moves.some((move) => this.definitions[move.definitionId]))
      return false;
    const now = this.engine.elapsedTimeMs;
    const turn = this.turns.get(source.id) ?? {
      nextSlot: 0,
      busyUntil: 0,
      casts: 0,
    };
    this.turns.set(source.id, turn);
    if (now < turn.busyUntil || source.hp <= 0) return true;
    for (let offset = 0; offset < moves.length; offset++) {
      const index = (turn.nextSlot + offset) % moves.length;
      const runtime = moves[index];
      const attack = this.definitions[runtime.definitionId];
      if (!attack || now < (runtime.readyAtMs ?? 0)) continue;
      const range = this.engine.getTowerAttackRange(attack.rangeIndex);
      const pattern = attack.pattern;
      const angle = BREATH_ANGLES[this.direction(source)];
      const target =
        pattern.kind === 'piercing'
          ? this.engine.enemies.find(
              (enemy) =>
                this.engine.isEnemyTargetable(enemy) &&
                this.inCorridor(
                  enemy,
                  source.position,
                  angle,
                  range,
                  pattern.width
                )
            )
          : this.engine.getTargetForTower(
              source,
              attack.rangeIndex,
              source.targetingMode ?? 'first'
            );
      if (!target) continue;
      const aim = this.vector(source.position, target.position);
      const aimAngle = Math.atan2(aim.y, aim.x);
      if (pattern.kind !== 'piercing')
        source.facingDirection =
          Math.abs(aim.x) > Math.abs(aim.y)
            ? aim.x > 0
              ? 'right'
              : 'left'
            : aim.y > 0
              ? 'down'
              : 'up';
      if (pattern.kind === 'cleave') {
        const side = turn.casts % 2 === 0 ? 1 : -1;
        this.effects.push({
          id: `run_claw_${++this.serial}`,
          kind: 'claw',
          position: { ...source.position },
          origin: { ...source.position },
          angle: aimAngle,
          radius: range,
          progress: 0,
          side,
          ageMs: 0,
          durationMs: attack.castMs,
        });
        for (const enemy of this.engine.enemies) {
          if (
            !this.engine.isEnemyTargetable(enemy) ||
            !this.engine.isEnemyInTowerRange(
              source.position,
              enemy,
              attack.rangeIndex
            )
          )
            continue;
          const enemyVector = this.vector(source.position, enemy.position);
          const difference = Math.atan2(
            Math.sin(Math.atan2(enemyVector.y, enemyVector.x) - aimAngle),
            Math.cos(Math.atan2(enemyVector.y, enemyVector.x) - aimAngle)
          );
          if (Math.abs(difference) <= pattern.halfAngle)
            this.hit(source, enemy, attack);
        }
        if (attack.visualEffectConfigId)
          this.engine.visualEffects.push({
            id: `run_claw_impact_${++this.serial}`,
            configId: attack.visualEffectConfigId,
            position: { ...target.position },
            durationMs: 240,
            elapsedMs: 0,
          });
      } else if (pattern.kind === 'aimed') {
        ProjectileBehavior.execute(this.engine, source, attack);
      } else if (pattern.kind === 'piercing') {
        source.facingDirection = this.direction(source);
        for (let pulse = 0; pulse < pattern.pulses; pulse++) {
          this.shots.push({
            id: `run_breath_${++this.serial}`,
            attack,
            source,
            origin: { ...source.position },
            position: { ...source.position },
            destination: this.offset(source.position, angle, range),
            angle,
            ageMs: -pulse * pattern.pulseIntervalMs,
            range,
            distance: 0,
            hitIds: new Set(),
          });
        }
      } else {
        const fanAngle =
          aimAngle + pattern.fanAngles[turn.casts % pattern.fanAngles.length];
        const distance = Math.min(range, Math.hypot(aim.x, aim.y));
        this.shots.push({
          id: `run_bomb_${++this.serial}`,
          attack,
          source,
          origin: { ...source.position },
          position: { ...source.position },
          destination: this.offset(source.position, fanAngle, distance),
          angle: fanAngle,
          ageMs: 0,
          range,
          distance: 0,
          hitIds: new Set(),
        });
      }
      runtime.lastFiredTime = now;
      runtime.readyAtMs =
        now + attack.cooldownMs / getAttackSpeedMultiplier(source, now);
      turn.busyUntil = now + attack.castMs;
      turn.nextSlot = (index + 1) % moves.length;
      turn.casts++;
      return true;
    }
    return true;
  }

  public tick(deltaMs: number) {
    this.effects.forEach((effect) => {
      effect.ageMs += deltaMs;
      effect.progress = effect.ageMs / effect.durationMs;
    });
    this.effects = this.effects.filter((effect) => effect.progress < 1);
    this.shots = this.shots.filter((shot) => {
      const previousAge = shot.ageMs;
      shot.ageMs += deltaMs;
      if (shot.ageMs < 0) return true;
      const pattern = shot.attack.pattern;
      if (pattern.kind === 'bomb') {
        const progress = Math.min(1, shot.ageMs / pattern.flightMs);
        shot.position = {
          x: shot.origin.x + (shot.destination.x - shot.origin.x) * progress,
          y: shot.origin.y + (shot.destination.y - shot.origin.y) * progress,
        };
        if (shot.ageMs < pattern.flightMs + pattern.fuseMs) return true;
        const radius = pattern.blastRadius;
        this.effects.push({
          id: `run_blast_${++this.serial}`,
          kind: 'blast',
          position: { ...shot.destination },
          origin: { ...shot.destination },
          angle: 0,
          radius,
          progress: 0,
          ageMs: 0,
          durationMs: 340,
        });
        for (const enemy of this.engine.enemies) {
          if (
            this.engine.isEnemyTargetable(enemy) &&
            this.engine.getAttackDistance(shot.destination, enemy.position) <=
              radius
          ) {
            this.hit(shot.source, enemy, shot.attack);
          }
        }
        return false;
      }
      if (pattern.kind !== 'piercing') return false;
      const previous = { ...shot.position };
      const travelMs = previousAge < 0 ? shot.ageMs : deltaMs;
      const step = Math.min(
        shot.range - shot.distance,
        (pattern.speed * travelMs) / 1000
      );
      shot.distance += step;
      shot.position = this.offset(shot.origin, shot.angle, shot.distance);
      for (const enemy of this.engine.enemies) {
        if (!this.engine.isEnemyTargetable(enemy) || shot.hitIds.has(enemy.id))
          continue;
        // Swept collision prevents a fast flame skipping enemies between frames.
        const vector = this.vector(previous, enemy.position);
        const along = Math.max(
          0,
          Math.min(
            step,
            vector.x * Math.cos(shot.angle) + vector.y * Math.sin(shot.angle)
          )
        );
        const closest = this.offset(previous, shot.angle, along);
        if (
          this.engine.getAttackDistance(closest, enemy.position) <=
          pattern.width
        ) {
          shot.hitIds.add(enemy.id);
          this.hit(shot.source, enemy, shot.attack);
        }
      }
      return shot.distance < shot.range;
    });
  }

  private hit(source: Tower, enemy: Enemy, attack: RunAttackDefinition) {
    EffectProcessor.applyDamageAndEffects(this.engine, source, enemy, attack);
    if (enemy.hp <= 0) this.engine.emitEnemyDefeated(enemy, source);
  }

  public get visuals(): RunAttackVisual[] {
    const shots: RunAttackVisual[] = this.shots
      .filter((shot) => shot.ageMs >= 0)
      .map((shot) => {
        const pattern = shot.attack.pattern;
        return {
          id: shot.id,
          kind: pattern.kind === 'bomb' ? 'bomb' : 'breath',
          position: shot.position,
          origin: shot.origin,
          angle: shot.angle,
          landing: pattern.kind === 'bomb' ? shot.destination : undefined,
          radius:
            pattern.kind === 'bomb'
              ? pattern.blastRadius
              : pattern.kind === 'piercing'
                ? pattern.width
                : 0,
          progress:
            pattern.kind === 'bomb'
              ? shot.ageMs / (pattern.flightMs + pattern.fuseMs)
              : shot.distance / shot.range,
          flightProgress:
            pattern.kind === 'bomb'
              ? Math.min(1, shot.ageMs / pattern.flightMs)
              : undefined,
        };
      });
    return [...this.effects, ...shots];
  }
}
