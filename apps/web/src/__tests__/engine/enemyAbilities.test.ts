import { describe, expect, it } from 'vitest';
import {
  getActiveSpeedMultiplier,
  hasActiveSpeedBoost,
} from '@/engine/tower-defense/speedModifiers';
import { ability, actor, battle, species } from './behaviorFixtures';

describe('Timed ally speed boosts', () => {
  it.each([1.4, 2.3])(
    'snapshots living allies, expires, and recasts using a configured %s multiplier',
    (speedMultiplier) => {
      const casterSpecies = species('test_speed_caster');
      const allySpecies = species('test_speed_ally');
      const move = ability({
        id: 'TEST_ALLY_SPEED',
        type: 'ALLY_SPEED_BOOST',
        initialCooldownMs: 100,
        cooldownMs: 800,
        durationMs: 400,
        speedMultiplier,
        visualEffectConfigId: 'attack_wind_gust_1',
      });
      const engine = battle();
      const caster = actor(engine, 'caster', casterSpecies.id, 10, move.id);
      engine.tick(0, move.initialCooldownMs - 1);
      expect(caster.abilityRuntime?.nextReadyTimeMs).toBe(
        move.initialCooldownMs
      );
      engine.tick(0, 1); // No eligible allies: readiness is retained.
      expect(engine.visualEffects).toHaveLength(0);
      const ally = actor(engine, 'ally', allySpecies.id, 30);
      const dead = actor(engine, 'dead', allySpecies.id, 40);
      dead.hp = 0;
      engine.tick(0, 1);
      expect(getActiveSpeedMultiplier(ally, engine.elapsedTimeMs)).toBe(
        speedMultiplier
      );
      expect(caster.speedBoostUntilMs).toBeUndefined();
      expect(dead.speedBoostUntilMs).toBeUndefined();
      expect(engine.visualEffects).toContainEqual(
        expect.objectContaining({
          configId: move.visualEffectConfigId,
          targetId: caster.id,
        })
      );
      const castAt = engine.elapsedTimeMs;
      expect(caster.abilityRuntime?.nextReadyTimeMs).toBe(
        castAt + move.cooldownMs
      );
      const late = actor(engine, 'late', allySpecies.id, ally.position.x);
      ally.speed = late.speed = 0.1;
      const start = ally.position.x;
      engine.tick(0, 100);
      expect(ally.position.x - start).toBeCloseTo(
        (late.position.x - start) * speedMultiplier
      );
      expect(late.speedBoostUntilMs).toBeUndefined();
      engine.tick(0, move.durationMs - 101);
      expect(hasActiveSpeedBoost(ally, engine.elapsedTimeMs)).toBe(true);
      engine.tick(0, 1);
      expect(hasActiveSpeedBoost(ally, engine.elapsedTimeMs)).toBe(false);
      engine.tick(0, move.cooldownMs - move.durationMs);
      expect(hasActiveSpeedBoost(ally, engine.elapsedTimeMs)).toBe(true);
      expect(hasActiveSpeedBoost(late, engine.elapsedTimeMs)).toBe(true);
    }
  );
});

describe('One-use defense boosts', () => {
  it.each([
    [1.5, 2.5],
    [3, 1.25],
  ])(
    'boosts defenses independently (%s, %s) once for the fight',
    (defenseMultiplier, specialDefenseMultiplier) => {
      const template = species('test_defense_caster');
      const move = ability({
        id: 'TEST_DEFENSE',
        type: 'SELF_DEFENSE_BOOST',
        initialCooldownMs: 1000,
        oncePerFight: true,
        defenseMultiplier,
        specialDefenseMultiplier,
        visualEffectConfigId: 'enemy_harden_1',
      });
      const engine = battle();
      const caster = actor(engine, 'caster', template.id, 30, move.id);
      const defense = caster.currentDefense;
      const specialDefense = caster.currentSpecialDefense;
      engine.tick(0, move.initialCooldownMs - 1);
      expect(caster.currentDefense).toBe(defense);
      expect(caster.currentSpecialDefense).toBe(specialDefense);
      engine.tick(0, 1);
      expect(caster.currentDefense).toBeCloseTo(defense * defenseMultiplier);
      expect(caster.currentSpecialDefense).toBeCloseTo(
        specialDefense * specialDefenseMultiplier
      );
      expect(caster.abilityRuntime?.hasActivated).toBe(true);
      expect(engine.visualEffects).toContainEqual(
        expect.objectContaining({
          configId: move.visualEffectConfigId,
          targetId: caster.id,
        })
      );
      engine.tick(0, 5000);
      expect(caster.currentDefense).toBeCloseTo(defense * defenseMultiplier);
      expect(caster.currentSpecialDefense).toBeCloseTo(
        specialDefense * specialDefenseMultiplier
      );
      expect(engine.visualEffects).toHaveLength(0);
    }
  );
});

describe('Proximity-triggered stacking support', () => {
  it.each([2, 4])(
    'requires the designated objective, affects eligible allies, caps speed, and stops after %s casts',
    (maxActivations) => {
      const casterSpecies = species('test_proximity_caster');
      const targetSpecies = species('test_proximity_ally');
      const otherSpecies = species('test_other_ally');
      const move = ability({
        id: 'TEST_STACKING_SUPPORT',
        type: 'PROXIMITY_HOWL_SPEED_STACK',
        initialCooldownMs: 0,
        cooldownMs: 600,
        triggerCaptureUnitTdConfigId: 'maribel_capture',
        triggerRadius: 8,
        targetCreatureId: targetSpecies.id,
        maxActivations,
        speedIncreasePerActivation: 0.4,
        maxSpeedMultiplier: 1.7,
        retreatSpeedMultiplier: 0.2,
        visualEffectConfigId: 'enemy_sonarion_howl_1',
      });
      const engine = battle({
        captureUnits: [
          {
            tdConfigId: move.triggerCaptureUnitTdConfigId,
            position: { x: 50, y: 50 },
            carrierSpeedMultiplier: 0.7,
          },
          { tdConfigId: 'kip_capture', position: { x: 20, y: 50 } },
        ],
      });
      const caster = actor(engine, 'caster', casterSpecies.id, 20, move.id);
      const original = actor(engine, 'original', targetSpecies.id, 30);
      const ineligible = actor(engine, 'other', otherSpecies.id, 30);
      const dead = actor(engine, 'dead', targetSpecies.id, 30);
      dead.hp = 0;
      engine.tick(0, 1);
      expect(caster.abilityRuntime?.activationCount).toBeUndefined();
      caster.position.x = 50 - move.triggerRadius;
      engine.tick(0, 1);
      expect(original.persistentSpeedBoostStackCount).toBe(1);
      expect(original.persistentSpeedBoostMultiplier).toBe(
        1 + move.speedIncreasePerActivation
      );
      expect(ineligible.persistentSpeedBoostMultiplier).toBeUndefined();
      expect(dead.persistentSpeedBoostMultiplier).toBeUndefined();
      expect(caster.isMovingBackward).toBe(true);
      expect(engine.visualEffects).toContainEqual(
        expect.objectContaining({ configId: move.visualEffectConfigId })
      );
      const late = actor(engine, 'late', targetSpecies.id, 30);
      expect(late.persistentSpeedBoostMultiplier).toBeUndefined();
      caster.position.x = 20;
      engine.captureUnits[0].position.x = 80; // Sequence continues after leaving the trigger.
      const stackCapacity = Math.ceil(
        (move.maxSpeedMultiplier - 1) / move.speedIncreasePerActivation
      );
      for (let cast = 2; cast <= maxActivations; cast++) {
        engine.tick(0, move.cooldownMs);
        expect(caster.abilityRuntime?.activationCount).toBe(cast);
        expect(original.persistentSpeedBoostStackCount).toBe(
          Math.min(cast, stackCapacity)
        );
        expect(original.persistentSpeedBoostMultiplier).toBeCloseTo(
          Math.min(
            move.maxSpeedMultiplier,
            1 + cast * move.speedIncreasePerActivation
          )
        );
        expect(late.persistentSpeedBoostStackCount).toBe(
          Math.min(cast - 1, stackCapacity)
        );
      }
      expect(engine.enemies).not.toContain(caster);
      engine.tick(0, move.cooldownMs);
      expect(original.persistentSpeedBoostStackCount).toBe(
        Math.min(maxActivations, stackCapacity)
      );
    }
  );

  it('combines persistent support buffs with the configured carrier slowdown', () => {
    const template = species('test_carrier');
    const carrierMultiplier = 0.7;
    const engine = battle({
      captureUnits: [
        {
          tdConfigId: 'maribel_capture',
          position: { x: 30, y: 50 },
          carrierSpeedMultiplier: carrierMultiplier,
        },
      ],
    });
    const carrier = actor(engine, 'carrier', template.id, 30);
    const captureUnit = engine.captureUnits[0];
    captureUnit.heldByEnemyId = carrier.id;
    carrier.heldCaptureUnitId = captureUnit.id;
    carrier.speed = 1;
    carrier.persistentSpeedBoostMultiplier = 3;
    engine.tick(0, 16);
    expect(carrier.position.x - 30).toBeCloseTo(
      (carrier.speed * 3 * carrierMultiplier * 16) / 16.666
    );
  });
});
