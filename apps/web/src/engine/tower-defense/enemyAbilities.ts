interface EnemyAbilityDefinitionBase {
  id: string;
  initialCooldownMs: number;
  visualEffectConfigId: string;
}

export type EnemyAbilityDefinition =
  | (EnemyAbilityDefinitionBase & {
      type: 'ALLY_SPEED_BOOST';
      cooldownMs: number;
      durationMs: number;
      speedMultiplier: number;
    })
  | (EnemyAbilityDefinitionBase & {
      type: 'SELF_DEFENSE_BOOST';
      oncePerFight: true;
      defenseMultiplier: number;
      specialDefenseMultiplier: number;
    })
  | (EnemyAbilityDefinitionBase & {
      type: 'PROXIMITY_HOWL_SPEED_STACK';
      cooldownMs: number;
      triggerCaptureUnitTdConfigId: string;
      triggerRadius: number;
      targetCreatureId: string;
      maxActivations: number;
      speedIncreasePerActivation: number;
      maxSpeedMultiplier: number;
      retreatSpeedMultiplier: number;
    })
  | (EnemyAbilityDefinitionBase & {
      type: 'TOWER_GROUND_ORB';
      cooldownMs: number;
      projectileTravelMs: number;
      aimDurationMs: number;
      maxHpDamageFraction: number;
      impactRadius: number;
      targetCount: number;
      cursedTargetCount?: number;
    });

/**
 * Enemy abilities intentionally live outside ATTACK_DEFS. Those definitions
 * are player attacks; enemy variants can therefore be balanced independently
 * without changing the move a captured Cosmoid uses as a tower.
 */
export const ENEMY_ABILITY_DEFS: Record<string, EnemyAbilityDefinition> = {
  MOTH_TAILWIND: {
    id: 'MOTH_TAILWIND',
    type: 'ALLY_SPEED_BOOST',
    initialCooldownMs: 7000,
    cooldownMs: 12000,
    durationMs: 4000,
    speedMultiplier: 1.6,
    visualEffectConfigId: 'attack_wind_gust_1',
  },
  BETTLE_HARDEN: {
    id: 'BETTLE_HARDEN',
    type: 'SELF_DEFENSE_BOOST',
    initialCooldownMs: 12000,
    oncePerFight: true,
    defenseMultiplier: 2,
    specialDefenseMultiplier: 2,
    visualEffectConfigId: 'enemy_harden_1',
  },
  SONARION_HOWL: {
    id: 'SONARION_HOWL',
    type: 'PROXIMITY_HOWL_SPEED_STACK',
    initialCooldownMs: 0,
    cooldownMs: 1400,
    triggerCaptureUnitTdConfigId: 'maribel_capture',
    triggerRadius: 11,
    targetCreatureId: 'resonarion',
    maxActivations: 3,
    speedIncreasePerActivation: 0.5,
    maxSpeedMultiplier: 30,
    retreatSpeedMultiplier: 0.1,
    visualEffectConfigId: 'enemy_sonarion_howl_1',
  },
  VOLTUSK_ELECTRIC_ORB: {
    id: 'VOLTUSK_ELECTRIC_ORB',
    type: 'TOWER_GROUND_ORB',
    initialCooldownMs: 2500,
    cooldownMs: 4500,
    projectileTravelMs: 1400,
    aimDurationMs: 350,
    maxHpDamageFraction: 0.25,
    impactRadius: 4,
    targetCount: 1,
    cursedTargetCount: 3,
    visualEffectConfigId: 'attack_spark_launch_1',
  },
};
