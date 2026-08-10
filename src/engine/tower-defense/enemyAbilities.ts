export interface EnemyAbilityDefinition {
  id: string;
  initialCooldownMs: number;
  cooldownMs: number;
  durationMs: number;
  speedMultiplier: number;
  visualEffectConfigId: string;
}

/**
 * Enemy abilities intentionally live outside ATTACK_DEFS. Those definitions
 * are player attacks; enemy variants can therefore be balanced independently
 * without changing the move a captured Cosmoid uses as a tower.
 */
export const ENEMY_ABILITY_DEFS: Record<string, EnemyAbilityDefinition> = {
  MOTH_TAILWIND: {
    id: 'MOTH_TAILWIND',
    initialCooldownMs: 7000,
    cooldownMs: 12000,
    durationMs: 4000,
    speedMultiplier: 1.6,
    visualEffectConfigId: 'attack_wind_gust_1',
  },
};
