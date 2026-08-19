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
};
