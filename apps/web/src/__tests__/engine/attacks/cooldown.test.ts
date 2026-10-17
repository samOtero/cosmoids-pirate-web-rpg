import { testDefinitionId } from '@/__tests__/utils/dataBuilders';
import { describe, expect, it, vi } from 'vitest';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { applyAttackSpeedBuff } from '@/engine/tower-defense/attackSpeedModifiers';
import { makeAttack, makeBattle, registerAttack } from './helpers';

describe('Shared attack activation and cooldowns', () => {
  it('uses the configured cooldown and preserves it when switching away and back', () => {
    const { engine, source, attack } = makeBattle();
    const other = registerAttack(
      makeAttack({ id: testDefinitionId('TEST_OTHER_PROJECTILE') })
    );
    source.equippedAttacksRuntime = [
      { definitionId: attack.id, lastFiredTime: 0 },
      { definitionId: other.id, lastFiredTime: 0 },
    ];
    const execute = vi.spyOn(ProjectileBehavior, 'execute');
    engine.tick(1001, 1);
    expect(execute).toHaveBeenCalledTimes(1);
    source.selectedAttackIndex = 1;
    engine.tick(1201, 200);
    expect(execute).toHaveBeenCalledTimes(2);
    source.selectedAttackIndex = 0;
    engine.tick(1501, 300);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(source.equippedAttacksRuntime[0].lastFiredTime).toBe(1001);
    engine.tick(2002, 501);
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('does not spend its cooldown without an eligible target', () => {
    const { engine, source, target, attack } = makeBattle();
    source.equippedAttacksRuntime = [
      { definitionId: attack.id, lastFiredTime: 0 },
    ];
    target.position.x = 80;
    const execute = vi.spyOn(ProjectileBehavior, 'execute');
    engine.tick(1001, 1);
    expect(execute).not.toHaveBeenCalled();
    expect(source.equippedAttacksRuntime[0].lastFiredTime).toBe(0);
    target.position.x = 10;
    engine.tick(1002, 1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('an attack-speed buff shortens ordinary attack cooldowns', () => {
    const { engine, source, attack } = makeBattle();
    source.equippedAttacksRuntime = [
      { definitionId: attack.id, lastFiredTime: 0 },
    ];
    const execute = vi.spyOn(ProjectileBehavior, 'execute');
    engine.tick(501, 1);
    expect(execute).not.toHaveBeenCalled();
    applyAttackSpeedBuff(source, 2, 3000, engine.elapsedTimeMs);
    engine.tick(502, 1);
    expect(execute).toHaveBeenCalledTimes(1);
    engine.tick(1003, 501);
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
