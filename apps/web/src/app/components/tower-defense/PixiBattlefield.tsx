import { getDefinitionVisuals } from '@/utils/definitionVisuals';
import { AttackId, SpeciesId } from '@/types/definitionIds';
import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  type RefObject,
} from 'react';
import * as PIXI from 'pixi.js';
import {
  TowerDefenseEngine,
  TD_CREATURE_DEFS,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ElementType } from '@/types/baseGame';
import { TD_BASE_HEIGHT } from '@/constants/game';

import {
  BaseTDUnit,
  DestroyedStructureVisual,
  Enemy,
  ObjectiveAlly,
  Point,
  StatusCondition,
  TDInitialView,
  TDOpeningPan,
  TDStructureSpriteLayout,
  Tower,
} from '@/engine/tower-defense/types';
import { interpolateKeyframes } from '@/utils/animationUtils';
import {
  resolveTDInitialView,
  resolveTDBattlefieldHeight,
  resolveTDOpeningPanView,
} from '@/utils/tdInitialView';
import {
  applyTDUnitTransforms,
  getTDUnitGroundContactOffset,
} from '@/utils/tdUnitVisuals';
import { getCaptureUnitVisualState } from '@/utils/captureUnitVisualState';
import { getTDRangePreviewRadius } from '@/utils/tdAttackRangePreview';
import {
  resolveTDDragPointer,
  resolveTDDragScrollAim,
  type TDDragPointer,
} from '@/utils/tdDragPointer';
import {
  advanceTDDragEdgeScroll,
  createTDDragEdgeScrollState,
} from '@/utils/tdDragEdgeScroll';
import { calculateTDWorldDepth } from '@/utils/tdDepthSorting';
import { buildTDOffscreenIndicators } from '@/utils/tdOffscreenIndicators';
import {
  PRISON_GATE_TEXTURES,
  resolvePrisonGateVisualLayout,
} from '@/utils/tdStructureVisuals';
import { drawRallyHowlRings, updateRallyIndicator } from './rallyHowlVisuals';
import { updateWarmthIndicator } from './warmthVisuals';
import {
  updateDeepwaterBreath,
  updateDeepwaterCoils,
} from './deepwaterGripVisuals';
import {
  createBarrelBowlingVisual,
  updateBarrelBowlingVisual,
} from './barrelBowlingVisuals';
import {
  drawFuseRushImpact,
  drawFuseRushTrail,
  updateFuseRushMarks,
} from './fuseRushVisuals';
import { updateSailcutterMark } from './sailcutterVisuals';
import {
  drawPhysicalDefenseShield,
  drawShipshapeHealing,
  drawShipshapeBrace,
} from './shipshapeVisuals';
import {
  drawSparkImpact,
  drawSparkLaunch,
  drawSparkProjectile,
  drawStaticYipImpact,
  drawStaticYipLaunch,
  drawStaticYipProjectile,
  getElectricAttackFlightProgress,
  getElectricAttackSockets,
} from './electricAttackVisuals';
import {
  drawGrumbleImpact,
  drawGrumbleLaunch,
  drawGrumbleProjectile,
} from './grumbleVisuals';
import {
  drawReverieOrbImpact,
  drawReverieOrbLaunch,
  drawReverieOrbProjectile,
  getDormateeOrbSocket,
  getReverieOrbWaveOffset,
} from './reverieOrbVisuals';
import { drawPalmSlamImpact } from './palmSlamVisuals';
import {
  hasActiveSpeedBoost,
  hasActiveSpeedSlow,
} from '@/engine/tower-defense/speedModifiers';
import {
  getActivePoisons,
  TOXIC_POLLEN_POISON_ID,
  VENOM_SPRAY_POISON_ID,
} from '@/engine/tower-defense/poison';

export const WEAKENED_THRESHOLD = 0.9;

const CARRIED_WORLD_DEPTH_OFFSET = 0.01;
const DRAGGED_WORLD_DEPTH = 1_000_000_000;
const FIRE_CLAW_TOWER_TINTS = [0xffffff, 0xfff1dc, 0xffddb0, 0xffc27a];
const FIRE_CLAW_DASH_TINTS = [0xffd5a3, 0xffbd73, 0xff9f43, 0xff7a1a];

function updateLaneHopVisual(
  container: PIXI.Container,
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  enemy: Enemy,
  screenW: number,
  screenH: number,
  finalScale: number
) {
  const hop = enemy.laneHopState;
  let marker = container.getChildByLabel('laneHopLandingMarker') as
    | PIXI.Graphics
    | undefined;
  const isPreparingOrAirborne =
    hop?.phase === 'windup' || hop?.phase === 'airborne';

  if (isPreparingOrAirborne && hop?.destination && finalScale > 0) {
    if (!marker) {
      marker = new PIXI.Graphics();
      marker.label = 'laneHopLandingMarker';
      container.addChildAt(marker, 0);
    }
    marker.visible = true;
    marker.clear();
    marker.ellipse(0, 0, 22, 8);
    marker.fill({ color: 0xfacc15, alpha: 0.14 });
    marker.stroke({ color: 0xfde047, alpha: 0.9, width: 2 });
    marker.position.set(
      (((hop.destination.x - enemy.position.x) / 100) * screenW) / finalScale,
      (((hop.destination.y - enemy.position.y) / 100) * screenH) / finalScale
    );
    const pulse = 0.9 + Math.sin(hop.elapsedMs * 0.012) * 0.12;
    marker.scale.set(pulse);
  } else if (marker) {
    marker.visible = false;
  }

  shadow.alpha = 1;
  if (hop?.phase === 'windup') {
    const anticipation = Math.max(
      0,
      Math.min(1, hop.elapsedMs / Math.max(1, hop.windupMs))
    );
    sprite.y += anticipation * 7;
    sprite.scale.y *= 1 - anticipation * 0.16;
  } else if (hop?.phase === 'airborne') {
    const progress = Math.max(
      0,
      Math.min(1, hop.elapsedMs / Math.max(1, hop.durationMs))
    );
    sprite.y -= Math.sin(progress * Math.PI) * hop.arcHeight;
    shadow.alpha = 0.42;
  }
}

function getContainerWorldDepth(
  container: PIXI.Container,
  localGroundContact: Point = { x: 0, y: 0 }
) {
  return calculateTDWorldDepth(
    container.x + localGroundContact.x * container.scale.x,
    container.y + localGroundContact.y * container.scale.y
  );
}

function updateContainerWorldDepth(
  container: PIXI.Container,
  localGroundContact: Point = { x: 0, y: 0 }
) {
  container.zIndex = getContainerWorldDepth(container, localGroundContact);
}

export function isUnitWeakened(
  unit: Pick<BaseTDUnit, 'hp' | 'maxHp' | 'isShiny' | 'weakenedThreshold'>
): boolean {
  if (unit.isShiny) return true;
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const threshold = unit.weakenedThreshold ?? WEAKENED_THRESHOLD;
  return hpRatio <= threshold;
}

export function renderHealthBar(
  unit: BaseTDUnit,
  container: PIXI.Container,
  configId: SpeciesId | string,
  hideWhenFull: boolean = false,
  offsetYOverride?: number
) {
  const tdConfigMap = getDefinitionVisuals(configId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    offsetYOverride ??
    tdConfig.healthBarOffsetY ??
    tdConfigMap.default?.healthBarOffsetY ??
    -40; // Default offset

  let hpBg = container.getChildByLabel('hpBg') as PIXI.Graphics | undefined;
  let hpFg = container.getChildByLabel('hpFg') as PIXI.Graphics | undefined;

  if (!hpBg || !hpFg) {
    hpBg = new PIXI.Graphics();
    hpBg.label = 'hpBg';
    container.addChild(hpBg);

    hpFg = new PIXI.Graphics();
    hpFg.label = 'hpFg';
    container.addChild(hpFg);
  }

  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const isWeakened = isUnitWeakened(unit);
  const isUncapturable = (unit as Partial<Enemy>).uncapturable;
  const isStructure = (unit as Enemy).kind === 'structure';
  const healthBarWidth = isStructure ? 128 : 64;

  // Draw background
  hpBg.clear();
  hpBg.rect(-healthBarWidth / 2 - 1, hpOffsetY - 1, healthBarWidth + 2, 6);
  hpBg.fill({ color: 0x000000 });
  hpBg.stroke({ color: 0x111111, width: 1 });

  // Draw foreground
  if (hideWhenFull && hpRatio >= 1 && !unit.isShiny) {
    hpBg.visible = false;
    hpFg.visible = false;
  } else {
    hpBg.visible = true;
    hpFg.visible = true;
    hpFg.clear();
    hpFg.rect(
      -healthBarWidth / 2,
      hpOffsetY,
      healthBarWidth * Math.max(0, hpRatio),
      4
    );
    if (isStructure) {
      hpFg.fill({ color: 0x22c55e }); // Structures stay green at every HP level
    } else if (isUncapturable) {
      hpFg.fill({ color: 0x3b82f6 }); // Blue
    } else {
      hpFg.fill({ color: isWeakened ? 0xff0000 : 0x22c55e });
    }
  }
}

function drawStar(g: PIXI.Graphics, size: number) {
  g.clear();
  g.moveTo(0, -size);
  g.quadraticCurveTo(0, 0, size, 0);
  g.quadraticCurveTo(0, 0, 0, size);
  g.quadraticCurveTo(0, 0, -size, 0);
  g.quadraticCurveTo(0, 0, 0, -size);
  const colors = [0xffeb3b, 0xffffff, 0xffd54f, 0x80deea, 0xf48fb1];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  g.fill({ color: randomColor });
}

function updateSparkles(
  container: PIXI.Container,
  unit: BaseTDUnit,
  delta: number
) {
  let sparkleContainer = container.getChildByLabel('sparkles') as
    | PIXI.Container
    | undefined;
  if (unit.isShiny) {
    if (!sparkleContainer) {
      sparkleContainer = new PIXI.Container();
      sparkleContainer.label = 'sparkles';
      container.addChild(sparkleContainer);
    }

    // Update existing sparkles
    const children = [...sparkleContainer.children] as PIXI.Graphics[];
    children.forEach((child: any) => {
      child.life -= delta;
      if (child.life <= 0) {
        sparkleContainer!.removeChild(child);
        child.destroy();
      } else {
        child.x += child.vx * delta;
        child.y += child.vy * delta;
        child.rotation += child.vRot * delta;

        const lifeRatio = child.life / child.maxLife;
        child.alpha = Math.min(1, lifeRatio * 1.5);
        child.scale.set(Math.min(1, lifeRatio * 1.5) * child.baseScale);
      }
    });

    // Spawn new sparkles if needed
    if (sparkleContainer.children.length < 6 && Math.random() < 0.15) {
      const star = new PIXI.Graphics();
      const size = 3 + Math.random() * 5;
      drawStar(star, size);

      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius - 10; // offset slightly upward

      const speed = 0.2 + Math.random() * 0.3;
      (star as any).vx = Math.cos(angle) * speed;
      (star as any).vy = Math.sin(angle) * speed - 0.1; // slight upward drift
      (star as any).vRot = (Math.random() - 0.5) * 0.05;
      (star as any).maxLife = 30 + Math.random() * 30;
      (star as any).life = (star as any).maxLife;
      (star as any).baseScale = 0.6 + Math.random() * 0.4;

      sparkleContainer.addChild(star);
    }
  } else {
    if (sparkleContainer) {
      container.removeChild(sparkleContainer);
      sparkleContainer.destroy({ children: true });
    }
  }
}

type SpeedBoostIndicator = PIXI.Container & {
  elapsed: number;
  displayedStackCount: number;
  stackPulseElapsed: number;
};

type PersistentSpeedStackAura = PIXI.Container & {
  elapsed: number;
  displayedStackCount: number;
  stackPulseElapsed: number;
};

function drawSpeedChevron(
  graphics: PIXI.Graphics,
  centerX: number,
  color: number
) {
  graphics.moveTo(centerX - 4, -5);
  graphics.lineTo(centerX + 1, 0);
  graphics.lineTo(centerX - 4, 5);
  graphics.stroke({ color, width: 2.5, cap: 'round', join: 'round' });
}

/**
 * Generic indicator for any active positive movement-speed modifier. It reads
 * only shared unit state, so attacks and abilities receive it automatically.
 */
function updateSpeedBoostIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  configId: SpeciesId | string,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('speedBoostIndicator') as
    | SpeedBoostIndicator
    | undefined;

  if (!hasActiveSpeedBoost(unit, currentTimeMs)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as SpeedBoostIndicator;
    indicator.label = 'speedBoostIndicator';
    indicator.elapsed = 0;
    indicator.displayedStackCount = 0;
    indicator.stackPulseElapsed = 999;

    const badge = new PIXI.Graphics();
    badge.label = 'speedBoostBadge';
    badge.circle(0, 0, 11);
    badge.fill({ color: 0x082f49, alpha: 0.9 });
    badge.stroke({ color: 0x67e8f9, alpha: 0.95, width: 2 });
    indicator.addChild(badge);

    const chevrons = new PIXI.Graphics();
    chevrons.label = 'speedBoostChevrons';
    drawSpeedChevron(chevrons, -2.5, 0xecfeff);
    drawSpeedChevron(chevrons, 4, 0x67e8f9);
    indicator.addChild(chevrons);

    const stackBadge = new PIXI.Graphics();
    stackBadge.label = 'speedBoostStackBadge';
    stackBadge.roundRect(8, -9, 26, 18, 9);
    stackBadge.fill({ color: 0x164e63, alpha: 0.96 });
    stackBadge.stroke({ color: 0xfacc15, alpha: 0.98, width: 1.5 });
    stackBadge.visible = false;
    indicator.addChild(stackBadge);

    const stackText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xfef9c3,
        stroke: { color: 0x082f49, width: 2 },
      },
    });
    stackText.label = 'speedBoostStackText';
    stackText.anchor.set(0.5);
    stackText.position.set(21, 0);
    stackText.visible = false;
    indicator.addChild(stackText);

    container.addChild(indicator);
  }

  indicator.elapsed += delta;
  indicator.stackPulseElapsed += delta;
  const stackCount = unit.persistentSpeedBoostStackCount ?? 0;
  if (indicator.displayedStackCount !== stackCount) {
    indicator.displayedStackCount = stackCount;
    indicator.stackPulseElapsed = 0;
  }
  const tdConfigMap = getDefinitionVisuals(configId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  indicator.position.set(stackCount > 0 ? 20 : 33, hpOffsetY - 13);

  const pulse = 1 + Math.sin(indicator.elapsed * 0.14) * 0.07;
  const stackArrivalPulse = Math.max(0, 1 - indicator.stackPulseElapsed / 18);
  indicator.scale.set(pulse + stackArrivalPulse * 0.28);
  indicator.alpha = 0.88 + Math.sin(indicator.elapsed * 0.1) * 0.12;

  const stackBadge = indicator.getChildByLabel('speedBoostStackBadge') as
    | PIXI.Graphics
    | undefined;
  const stackText = indicator.getChildByLabel('speedBoostStackText') as
    | PIXI.Text
    | undefined;
  if (stackBadge) stackBadge.visible = stackCount > 0;
  if (stackText) {
    stackText.visible = stackCount > 0;
    stackText.text = stackCount > 0 ? `×${stackCount}` : '';
  }

  const chevrons = indicator.getChildByLabel('speedBoostChevrons') as
    | PIXI.Graphics
    | undefined;
  if (chevrons) {
    chevrons.x = ((indicator.elapsed * 0.08) % 3) - 1.5;
  }
}

/**
 * Persistent howl-stack treatment: each received stack adds a separate
 * counter-rotating energy orbit around the boosted unit.
 */
function updatePersistentSpeedStackAura(
  container: PIXI.Container,
  unit: BaseTDUnit,
  delta: number
) {
  const stackCount = unit.persistentSpeedBoostStackCount ?? 0;
  let aura = container.getChildByLabel('persistentSpeedStackAura') as
    | PersistentSpeedStackAura
    | undefined;

  if (stackCount <= 0) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  if (!aura) {
    aura = new PIXI.Container() as PersistentSpeedStackAura;
    aura.label = 'persistentSpeedStackAura';
    aura.elapsed = 0;
    aura.displayedStackCount = 0;
    aura.stackPulseElapsed = 999;
    aura.y = 5;
    // Place the buildup over the shadow but behind the creature artwork.
    container.addChildAt(aura, Math.min(1, container.children.length));
  }

  aura.elapsed += delta;
  aura.stackPulseElapsed += delta;

  if (aura.displayedStackCount !== stackCount) {
    aura.removeChildren().forEach((child) => child.destroy());
    for (let index = 0; index < stackCount; index += 1) {
      const ring = new PIXI.Graphics();
      ring.label = `persistentSpeedStackRing${index}`;
      const radiusX = 28 + index * 6;
      const radiusY = 10 + index * 2;
      ring.ellipse(0, 0, radiusX, radiusY);
      ring.stroke({
        color: index % 2 === 0 ? 0x67e8f9 : 0xfacc15,
        width: 2.4,
        alpha: 0.76,
      });
      ring.circle(radiusX, 0, 3.2);
      ring.fill({ color: 0xfef9c3, alpha: 0.96 });
      aura.addChild(ring);
    }
    aura.displayedStackCount = stackCount;
    aura.stackPulseElapsed = 0;
  }

  const arrivalPulse = Math.max(0, 1 - aura.stackPulseElapsed / 22);
  const idlePulse = 1 + Math.sin(aura.elapsed * 0.075) * 0.035;
  aura.scale.set(idlePulse + arrivalPulse * 0.24);
  aura.alpha = 0.62 + Math.sin(aura.elapsed * 0.08) * 0.12;

  aura.children.forEach((child, index) => {
    child.rotation =
      aura!.elapsed * (index % 2 === 0 ? 0.012 : -0.009) + index * 0.7;
  });
}

type SpeedSlowIndicator = PIXI.Container & {
  elapsed: number;
};

/** A persistent silk ring that makes String Shot's indefinite slow readable. */
function updateSpeedSlowIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('speedSlowIndicator') as
    | SpeedSlowIndicator
    | undefined;

  if (!hasActiveSpeedSlow(unit, currentTimeMs)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as SpeedSlowIndicator;
    indicator.label = 'speedSlowIndicator';
    indicator.elapsed = 0;
    indicator.y = -7;

    const web = new PIXI.Graphics();
    web.label = 'speedSlowWeb';
    [
      { width: 54, height: 13, y: -7 },
      { width: 60, height: 15, y: 2 },
      { width: 48, height: 11, y: 11 },
    ].forEach(({ width, height, y }) => {
      web.ellipse(0, y, width / 2, height / 2);
      web.stroke({ color: 0x64748b, width: 4, alpha: 0.7 });
      web.ellipse(0, y - 1, width / 2, height / 2);
      web.stroke({ color: 0xf8fafc, width: 2, alpha: 0.95 });
    });
    web.moveTo(-25, -7);
    web.lineTo(-19, 12);
    web.moveTo(25, -7);
    web.lineTo(19, 12);
    web.stroke({ color: 0xbae6fd, width: 1.5, alpha: 0.85 });
    indicator.addChild(web);

    // Keep the lingering web below UI badges but over the creature sprite.
    container.addChildAt(indicator, Math.min(2, container.children.length));
  }

  indicator.elapsed += delta;
  const pulse = 1 + Math.sin(indicator.elapsed * 0.09) * 0.025;
  indicator.scale.set(pulse, 1);
  indicator.alpha = 0.78 + Math.sin(indicator.elapsed * 0.06) * 0.1;
}

type DefenseBoostIndicator = PIXI.Container & {
  elapsed: number;
  physicalOnly?: boolean;
};

function drawDefenseShield(graphics: PIXI.Graphics) {
  graphics.moveTo(0, -6.5);
  graphics.lineTo(6, -4);
  graphics.lineTo(5, 2);
  graphics.quadraticCurveTo(3.5, 6, 0, 8);
  graphics.quadraticCurveTo(-3.5, 6, -5, 2);
  graphics.lineTo(-6, -4);
  graphics.closePath();
  graphics.fill({ color: 0xf8fafc, alpha: 0.95 });
  graphics.stroke({ color: 0x64748b, width: 1.5, join: 'round' });
  graphics.moveTo(0, -4.5);
  graphics.lineTo(0, 5.5);
  graphics.stroke({ color: 0x94a3b8, width: 1.5, alpha: 0.95 });
}

function hasDefenseBoost(unit: BaseTDUnit) {
  return (
    (unit.defenseBoostMultiplier ?? 1) > 1 ||
    (unit.specialDefenseBoostMultiplier ?? 1) > 1
  );
}

/** Persistent badge for physical and special defense increases. */
function updateDefenseBoostIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  configId: SpeciesId | string,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('defenseBoostIndicator') as
    | DefenseBoostIndicator
    | undefined;

  if (!hasDefenseBoost(unit)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  const physicalOnly =
    (unit.defenseBoostMultiplier ?? 1) > 1 &&
    (unit.specialDefenseBoostMultiplier ?? 1) <= 1;
  if (indicator && indicator.physicalOnly !== physicalOnly) {
    container.removeChild(indicator);
    indicator.destroy({ children: true });
    indicator = undefined;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as DefenseBoostIndicator;
    indicator.label = 'defenseBoostIndicator';
    indicator.elapsed = 0;
    indicator.physicalOnly = physicalOnly;

    const badge = new PIXI.Graphics();
    badge.circle(0, 0, 11);
    badge.fill({ color: 0x1e293b, alpha: 0.92 });
    badge.stroke({
      color: physicalOnly ? 0xd99659 : 0xcbd5e1,
      alpha: 0.98,
      width: 2,
    });
    indicator.addChild(badge);

    const shield = new PIXI.Graphics();
    shield.label = 'defenseBoostShield';
    if (physicalOnly) drawPhysicalDefenseShield(shield);
    else drawDefenseShield(shield);
    indicator.addChild(shield);

    container.addChild(indicator);
  }

  indicator.elapsed += delta;
  const tdConfigMap = getDefinitionVisuals(configId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  const hasSpeedBadge = hasActiveSpeedBoost(unit, currentTimeMs);
  indicator.position.set(hasSpeedBadge ? 7 : 33, hpOffsetY - 13);

  const pulse = 1 + Math.sin(indicator.elapsed * 0.1) * 0.045;
  indicator.scale.set(pulse);
  indicator.alpha = 0.9 + Math.sin(indicator.elapsed * 0.075) * 0.1;

  const shield = indicator.getChildByLabel('defenseBoostShield') as
    | PIXI.Graphics
    | undefined;
  if (shield) {
    shield.y = Math.sin(indicator.elapsed * 0.08) * 0.6;
  }
}

type ResonantEvolutionIndicator = PIXI.Container & {
  elapsed: number;
};

function updateResonantEvolutionIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  currentTimeMs: number,
  delta: number
) {
  const state = enemy.resonantEvolutionState;
  const isRecovering =
    (enemy.resonantEvolutionRecoveryUntilMs ?? 0) > currentTimeMs;
  let indicator = container.getChildByLabel('resonantEvolutionIndicator') as
    | ResonantEvolutionIndicator
    | undefined;

  if (!state && !isRecovering) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as ResonantEvolutionIndicator;
    indicator.label = 'resonantEvolutionIndicator';
    indicator.elapsed = 0;
    const rings = new PIXI.Graphics();
    rings.label = 'resonantEvolutionRings';
    indicator.addChild(rings);
    container.addChildAt(indicator, Math.min(1, container.children.length));
  }

  indicator.elapsed += delta;
  const rings = indicator.getChildByLabel('resonantEvolutionRings') as
    | PIXI.Graphics
    | undefined;
  if (!rings) return;

  const isChanneling = state?.phase === 'channeling';
  const isEvolving = isChanneling && state?.role === 'evolving';
  const progress = state
    ? Math.max(
        0,
        Math.min(1, (currentTimeMs - state.startedAtMs) / state.durationMs)
      )
    : 1;
  const pulse = Math.sin(indicator.elapsed * 0.12);
  const primaryColor = isEvolving || isRecovering ? 0xfacc15 : 0x67e8f9;

  rings.clear();
  const ringCount = state?.phase === 'forming' ? 2 : 3;
  for (let index = 0; index < ringCount; index++) {
    const radius = 20 + index * 7 + pulse * (1.5 + index * 0.4);
    rings.circle(0, 0, radius);
    rings.stroke({
      color: index === 1 ? 0x67e8f9 : primaryColor,
      alpha: 0.28 + index * 0.12,
      width: isEvolving ? 2.5 : 1.8,
    });
  }
  if (state || isRecovering) {
    rings.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    rings.stroke({
      color: primaryColor,
      alpha: 0.95,
      width: isEvolving || isRecovering ? 4 : 2.5,
      cap: 'round',
    });
  }
  indicator.rotation = isEvolving
    ? indicator.elapsed * 0.003
    : -indicator.elapsed * 0.002;
  indicator.alpha = isRecovering ? 1 : 0.78 + progress * 0.22;
}

type CursedFlame = PIXI.Graphics & {
  age: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  phase: number;
  wobbleSpeed: number;
  baseScale: number;
};

type CursedAuraContainer = PIXI.Container & {
  elapsed: number;
};

function drawCursedFlame(flame: PIXI.Graphics, size: number) {
  const outerColors = [0x3b0764, 0x581c87, 0x6b21a8];
  const innerColors = [0xa855f7, 0xc084fc, 0xe879f9];
  const colorIndex = Math.floor(Math.random() * outerColors.length);

  flame.moveTo(0, -size);
  flame.bezierCurveTo(
    size * 0.85,
    -size * 0.05,
    size * 0.62,
    size * 0.72,
    0,
    size
  );
  flame.bezierCurveTo(
    -size * 0.68,
    size * 0.68,
    -size * 0.72,
    -size * 0.08,
    0,
    -size
  );
  flame.fill({ color: outerColors[colorIndex], alpha: 0.88 });

  flame.moveTo(size * 0.06, -size * 0.38);
  flame.bezierCurveTo(
    size * 0.42,
    size * 0.04,
    size * 0.25,
    size * 0.48,
    0,
    size * 0.62
  );
  flame.bezierCurveTo(
    -size * 0.25,
    size * 0.35,
    -size * 0.22,
    0,
    size * 0.06,
    -size * 0.38
  );
  flame.fill({ color: innerColors[colorIndex], alpha: 0.9 });
}

function drawProjectileFlame(
  flame: PIXI.Graphics,
  outerColor: number,
  innerColor: number
) {
  const size = 8;

  flame.moveTo(0, -size * 1.25);
  flame.bezierCurveTo(
    size * 0.9,
    -size * 0.25,
    size * 0.85,
    size * 0.75,
    0,
    size
  );
  flame.bezierCurveTo(
    -size * 0.85,
    size * 0.75,
    -size * 0.9,
    -size * 0.25,
    0,
    -size * 1.25
  );
  flame.fill({ color: outerColor });

  flame.moveTo(0, -size * 0.45);
  flame.bezierCurveTo(size * 0.42, 0, size * 0.38, size * 0.48, 0, size * 0.62);
  flame.bezierCurveTo(
    -size * 0.38,
    size * 0.48,
    -size * 0.42,
    0,
    0,
    -size * 0.45
  );
  flame.fill({ color: innerColor });

  // The flame is drawn vertically; turn its rounded edge toward travel.
  flame.rotation = -Math.PI / 2;
}

function drawWaterStreamSegment(
  water: PIXI.Graphics,
  outerColor: number,
  innerColor: number,
  highlightColor: number
) {
  water.moveTo(-11, 0);
  water.bezierCurveTo(-5, -6, 5, -7, 11, 0);
  water.bezierCurveTo(5, 7, -5, 6, -11, 0);
  water.fill({ color: outerColor });

  water.moveTo(-7, -0.5);
  water.bezierCurveTo(-2, -3.8, 5, -4.2, 8, -0.3);
  water.bezierCurveTo(3, 3.7, -2, 3.2, -7, -0.5);
  water.fill({ color: innerColor });

  water.ellipse(2.5, -2.1, 3.8, 1.25);
  water.fill({ color: highlightColor, alpha: 0.9 });
}

function drawSailcutterBlade(
  blade: PIXI.Graphics,
  shadowColor: number,
  windColor: number,
  highlightColor: number
) {
  blade.moveTo(-5, -33);
  blade.bezierCurveTo(15, -24, 23, -7, 19, 8);
  blade.bezierCurveTo(15, 22, 5, 30, -7, 34);
  blade.bezierCurveTo(6, 18, 10, 5, 8, -7);
  blade.bezierCurveTo(6, -18, 1, -27, -5, -33);
  blade.closePath();
  blade.fill({ color: windColor, alpha: 0.96 });
  blade.stroke({ color: shadowColor, width: 2.5, alpha: 0.76, join: 'round' });

  blade.moveTo(-1, -28);
  blade.bezierCurveTo(11, -19, 16, -4, 12, 9);
  blade.bezierCurveTo(9, 20, 3, 27, -3, 31);
  blade.stroke({
    color: highlightColor,
    width: 2.4,
    alpha: 0.95,
    cap: 'round',
  });
}

function drawSailcutterProjectile(
  container: PIXI.Container,
  shadowColor: number,
  windColor: number,
  highlightColor: number
) {
  const upperBlade = new PIXI.Graphics();
  upperBlade.label = 'sailcutter_upper_blade';
  drawSailcutterBlade(upperBlade, shadowColor, windColor, highlightColor);
  upperBlade.position.set(-6, -3);
  upperBlade.rotation = -0.09;
  upperBlade.scale.set(0.88);
  upperBlade.alpha = 0.82;
  container.addChild(upperBlade);

  const lowerBlade = new PIXI.Graphics();
  lowerBlade.label = 'sailcutter_lower_blade';
  drawSailcutterBlade(lowerBlade, shadowColor, windColor, highlightColor);
  lowerBlade.position.set(6, 3);
  lowerBlade.rotation = 0.09;
  container.addChild(lowerBlade);
}

type FlyingColorsTrailPoint = { x: number; y: number; time: number };

const FLYING_COLORS_TRAIL_LIFETIME_MS = 260;
const FLYING_COLORS_TRAIL_PALETTE = [0xfb7185, 0x38bdf8, 0x4ade80];

function drawFlyingColorsTrail(
  graphics: PIXI.Graphics,
  points: FlyingColorsTrailPoint[],
  now: number,
  color: number
) {
  graphics.clear();
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const fade = Math.max(
      0,
      1 - (now - from.time) / FLYING_COLORS_TRAIL_LIFETIME_MS
    );
    graphics.moveTo(from.x, from.y);
    graphics.lineTo(to.x, to.y);
    graphics.stroke({ color, width: 5.5, alpha: 0.16 * fade, cap: 'round' });
    graphics.moveTo(from.x, from.y);
    graphics.lineTo(to.x, to.y);
    graphics.stroke({
      color: 0xfff7ed,
      width: 1.4,
      alpha: 0.48 * fade,
      cap: 'round',
    });
  }
}

function drawWaterDashTrail(trail: PIXI.Graphics) {
  const streaks = [
    { y: -16, length: 58, width: 7, color: 0x7dd3fc },
    { y: -5, length: 76, width: 10, color: 0x0ea5e9 },
    { y: 7, length: 70, width: 9, color: 0x38bdf8 },
    { y: 18, length: 52, width: 6, color: 0xbae6fd },
  ];

  streaks.forEach(({ y, length, width, color }, index) => {
    const drawStreakPath = () => {
      trail.moveTo(-5, y);
      trail.bezierCurveTo(
        -length * 0.35,
        y - 7 + index * 2,
        -length * 0.72,
        y + 7 - index * 2,
        -length,
        y
      );
    };
    drawStreakPath();
    trail.stroke({
      color: 0x075985,
      width: width + 6,
      alpha: 0.72,
      cap: 'round',
    });
    drawStreakPath();
    trail.stroke({ color, width, alpha: 1, cap: 'round' });
  });

  const droplets = [
    { x: -23, y: -27, r: 4.2 },
    { x: -42, y: 27, r: 3.8 },
    { x: -62, y: -22, r: 3.2 },
    { x: -17, y: 29, r: 3 },
    { x: -71, y: 13, r: 2.6 },
  ];
  droplets.forEach(({ x, y, r }) => trail.circle(x, y, r));
  trail.fill({ color: 0xd9f7ff, alpha: 1 });
}

function drawCoirBola(
  container: PIXI.Container,
  shadowColor: number,
  fiberColor: number,
  highlightColor: number,
  sparkColor: number
) {
  const core = new PIXI.Container();
  core.label = 'coir_bola_core';

  const knot = new PIXI.Graphics();
  knot.circle(0, 0, 9);
  knot.fill({ color: shadowColor });
  knot.circle(0, 0, 7.2);
  knot.fill({ color: fiberColor });
  knot.arc(0, 0, 5.2, -0.35, Math.PI * 1.5);
  knot.stroke({ color: highlightColor, width: 1.7, alpha: 0.95 });
  knot.arc(0, 0, 3.1, Math.PI * 0.75, Math.PI * 2.35);
  knot.stroke({ color: shadowColor, width: 1.3, alpha: 0.75 });
  knot.ellipse(2.2, -3.1, 2.1, 1.2);
  knot.fill({ color: highlightColor, alpha: 0.72 });
  core.addChild(knot);

  const leafGlint = new PIXI.Graphics();
  leafGlint.moveTo(5.5, -7);
  leafGlint.quadraticCurveTo(10, -9, 10.5, -4.5);
  leafGlint.quadraticCurveTo(7.5, -3.5, 5.5, -7);
  leafGlint.fill({ color: sparkColor, alpha: 0.9 });
  core.addChild(leafGlint);

  container.addChild(core);
}

function drawCoirSnareImpact(
  container: PIXI.Container,
  shadowColor: number,
  fiberColor: number,
  highlightColor: number,
  sparkColor: number
) {
  const snare = new PIXI.Container();
  snare.label = 'coir_snare_loops';
  snare.y = -9;

  const loops = new PIXI.Graphics();
  const loopSpecs = [
    { y: -13, width: 48, height: 11, rotation: -0.08 },
    { y: -2, width: 55, height: 13, rotation: 0.06 },
    { y: 9, width: 45, height: 10, rotation: -0.04 },
  ];
  loopSpecs.forEach(({ y, width, height }) => {
    loops.ellipse(0, y, width / 2, height / 2);
    loops.stroke({ color: shadowColor, width: 6, alpha: 0.9 });
    loops.ellipse(0, y, width / 2, height / 2);
    loops.stroke({ color: fiberColor, width: 3.5, alpha: 1 });
    loops.ellipse(0, y - 0.8, width / 2, height / 2);
    loops.stroke({ color: highlightColor, width: 1, alpha: 0.75 });
  });
  loops.rotation = loopSpecs[1].rotation;
  snare.addChild(loops);

  const knot = new PIXI.Graphics();
  knot.label = 'coir_snare_knot';
  knot.circle(27, -2, 5.2);
  knot.fill({ color: shadowColor });
  knot.circle(27, -2, 3.5);
  knot.fill({ color: fiberColor });
  knot.moveTo(25, -4);
  knot.lineTo(30, 1);
  knot.stroke({ color: highlightColor, width: 1.2, alpha: 0.9 });
  snare.addChild(knot);

  container.addChild(snare);

  const fibers = new PIXI.Graphics();
  fibers.label = 'coir_snare_fibers';
  const fiberAngles = [-2.8, -2.1, -1.3, -0.55, 0.2, 0.85, 1.55, 2.35];
  fiberAngles.forEach((angle, index) => {
    const innerRadius = 23 + (index % 2) * 3;
    const outerRadius = innerRadius + 8 + (index % 3) * 2;
    fibers.moveTo(
      Math.cos(angle) * innerRadius,
      -8 + Math.sin(angle) * innerRadius * 0.45
    );
    fibers.lineTo(
      Math.cos(angle) * outerRadius,
      -8 + Math.sin(angle) * outerRadius * 0.55
    );
  });
  fibers.stroke({ color: highlightColor, width: 2, alpha: 0.88 });
  container.addChild(fibers);

  const sparks = new PIXI.Graphics();
  sparks.label = 'coir_snare_sparks';
  const sparkPositions = [
    { x: -30, y: -23, scale: 1 },
    { x: -21, y: 10, scale: 0.7 },
    { x: 4, y: -30, scale: 0.85 },
    { x: 25, y: -19, scale: 0.75 },
    { x: 32, y: 6, scale: 0.9 },
  ];
  sparkPositions.forEach(({ x, y, scale }) => {
    sparks.moveTo(x, y - 4 * scale);
    sparks.quadraticCurveTo(x + 4 * scale, y, x, y + 4 * scale);
    sparks.quadraticCurveTo(x - 4 * scale, y, x, y - 4 * scale);
    sparks.fill({ color: sparkColor, alpha: 0.95 });
  });
  container.addChild(sparks);
}

function updateCoirSnareImpact(container: PIXI.Container, progress: number) {
  const snare = container.getChildByLabel('coir_snare_loops') as
    | PIXI.Container
    | undefined;
  const fibers = container.getChildByLabel('coir_snare_fibers') as
    | PIXI.Graphics
    | undefined;
  const sparks = container.getChildByLabel('coir_snare_sparks') as
    | PIXI.Graphics
    | undefined;

  const unfurl = Math.min(1, progress / 0.18);
  const tighten = Math.min(1, Math.max(0, (progress - 0.18) / 0.22));
  const fade = Math.min(1, Math.max(0, (progress - 0.78) / 0.22));

  if (snare) {
    const widthScale = (0.2 + unfurl * 0.95) * (1 - tighten * 0.12);
    const heightScale = (0.35 + unfurl * 0.8) * (1 - tighten * 0.2);
    snare.scale.set(widthScale, heightScale);
    snare.rotation = Math.sin(progress * Math.PI * 5) * 0.025;
  }

  if (fibers) {
    fibers.scale.set(0.55 + unfurl * 0.65);
    fibers.alpha = Math.max(0, 1 - progress / 0.42);
  }

  if (sparks) {
    sparks.scale.set(0.7 + unfurl * 0.6);
    sparks.alpha = Math.max(0, 1 - progress / 0.5);
    sparks.rotation = progress * 0.35;
  }

  container.alpha = 1 - fade;
}

function drawBarrelBashImpact(container: PIXI.Container) {
  const wave = new PIXI.Graphics();
  wave.label = 'barrel_bash_wave';
  container.addChild(wave);

  const splash = new PIXI.Graphics();
  splash.label = 'barrel_bash_splash';
  container.addChild(splash);
}

function updateBarrelBashImpact(container: PIXI.Container, progress: number) {
  const wave = container.getChildByLabel('barrel_bash_wave') as
    | PIXI.Graphics
    | undefined;
  const splash = container.getChildByLabel('barrel_bash_splash') as
    | PIXI.Graphics
    | undefined;
  const burst = Math.min(1, progress / 0.35);
  const fade = Math.min(1, Math.max(0, (progress - 0.62) / 0.38));
  const opacity = 1 - fade;

  if (wave) {
    const radius = 10 + burst * 42;
    wave.clear();
    wave.ellipse(0, 5, radius, radius * 0.42);
    wave.stroke({ color: 0x38bdf8, width: 8, alpha: 0.72 * opacity });
    wave.ellipse(0, 5, radius * 0.78, radius * 0.31);
    wave.stroke({ color: 0xbae6fd, width: 3, alpha: 0.9 * opacity });
  }

  if (splash) {
    splash.clear();
    for (let index = 0; index < 12; index += 1) {
      const angle = -Math.PI * 0.9 + (index / 11) * Math.PI * 1.8;
      const distance = (18 + (index % 4) * 6) * burst;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 8 * burst;
      const size = 2.5 + (index % 3);
      splash.ellipse(x, y, size, size * 1.7);
      splash.fill({
        color: index % 3 === 0 ? 0xbae6fd : 0x0ea5e9,
        alpha: 0.85 * opacity,
      });
    }
  }

  container.alpha = opacity;
}

function drawWindGust(container: PIXI.Container) {
  const haze = new PIXI.Graphics();
  haze.label = 'wind_gust_haze';
  container.addChild(haze);

  const rings = new PIXI.Graphics();
  rings.label = 'wind_gust_rings';
  container.addChild(rings);

  const streaks = new PIXI.Graphics();
  streaks.label = 'wind_gust_streaks';
  container.addChild(streaks);
}

function drawFunnyDance(container: PIXI.Container) {
  const haze = new PIXI.Graphics();
  haze.label = 'funny_dance_haze';
  container.addChild(haze);

  const motionLines = new PIXI.Graphics();
  motionLines.label = 'funny_dance_motion_lines';
  container.addChild(motionLines);

  const notes = new PIXI.Graphics();
  notes.label = 'funny_dance_notes';
  container.addChild(notes);
}

function drawSharedSlumberCast(container: PIXI.Container) {
  const pulse = new PIXI.Graphics();
  pulse.label = 'shared_slumber_pulse';
  container.addChild(pulse);

  const links = new PIXI.Graphics();
  links.label = 'shared_slumber_links';
  container.addChild(links);

  const orb = new PIXI.Graphics();
  orb.label = 'shared_slumber_orb';
  container.addChild(orb);
}

function updateSharedSlumberCast(
  container: PIXI.Container,
  progress: number,
  maxRadius: number,
  targetOffsets: Point[]
) {
  const pulse = container.getChildByLabel('shared_slumber_pulse') as
    | PIXI.Graphics
    | undefined;
  const links = container.getChildByLabel('shared_slumber_links') as
    | PIXI.Graphics
    | undefined;
  const orb = container.getChildByLabel('shared_slumber_orb') as
    | PIXI.Graphics
    | undefined;
  const entrance = Math.min(1, progress / 0.24);
  const expansion = 1 - Math.pow(1 - Math.min(1, progress / 0.62), 3);
  const fade = 1 - Math.max(0, (progress - 0.68) / 0.32);
  const radius = Math.max(4, maxRadius * expansion);
  const orbY = -28 - 34 * entrance + Math.sin(progress * Math.PI * 3) * 2;

  if (pulse) {
    pulse.clear();
    pulse.ellipse(0, 7, radius, radius * 0.48);
    pulse.fill({ color: 0xa78bfa, alpha: 0.12 * fade });
    pulse.ellipse(0, 7, radius * 0.64, radius * 0.3);
    pulse.fill({ color: 0xf5d0fe, alpha: 0.16 * fade });
  }

  if (links) {
    links.clear();
    const linkFade = Math.min(1, progress / 0.18) * fade;
    targetOffsets.forEach((target, index) => {
      const endX = target.x * expansion;
      const endY = target.y * expansion - 18;
      const controlX = endX * 0.5 + (index % 2 === 0 ? -8 : 8);
      const controlY = Math.min(orbY, endY) - 22 - (index % 3) * 4;
      links.moveTo(0, orbY);
      links.quadraticCurveTo(controlX, controlY, endX, endY);
      links.stroke({
        color: index % 2 === 0 ? 0xf0abfc : 0xc4b5fd,
        alpha: 0.74 * linkFade,
        width: 2.4,
        cap: 'round',
      });
      links.circle(endX, endY, 3.2);
      links.fill({ color: 0xfdf4ff, alpha: 0.92 * linkFade });
    });
  }

  if (orb) {
    orb.clear();
    orb.circle(0, orbY, 14 * entrance);
    orb.fill({ color: 0xe9d5ff, alpha: 0.96 * fade });
    orb.stroke({ color: 0xfdf4ff, alpha: fade, width: 2.2 });
    orb.circle(-4, orbY - 4, 4 * entrance);
    orb.fill({ color: 0xffffff, alpha: 0.82 * fade });
    for (let index = 0; index < 4; index += 1) {
      const angle = progress * Math.PI * 2 + (index / 4) * Math.PI * 2;
      const distance = 21 + index * 2;
      orb.circle(
        Math.cos(angle) * distance,
        orbY + Math.sin(angle) * distance * 0.62,
        1.8 + (index % 2)
      );
      orb.fill({ color: 0xf0abfc, alpha: 0.72 * fade });
    }
  }

  container.alpha = fade;
}

function drawSharedSlumberWake(container: PIXI.Container) {
  const bubble = new PIXI.Graphics();
  bubble.label = 'shared_slumber_wake_bubble';
  container.addChild(bubble);

  const sparkles = new PIXI.Graphics();
  sparkles.label = 'shared_slumber_wake_sparkles';
  container.addChild(sparkles);
}

function updateSharedSlumberWake(container: PIXI.Container, progress: number) {
  const bubble = container.getChildByLabel('shared_slumber_wake_bubble') as
    | PIXI.Graphics
    | undefined;
  const sparkles = container.getChildByLabel('shared_slumber_wake_sparkles') as
    | PIXI.Graphics
    | undefined;
  const pop = Math.min(1, progress / 0.38);
  const fade = 1 - Math.max(0, (progress - 0.55) / 0.45);

  if (bubble) {
    bubble.clear();
    bubble.circle(0, -34, 14 + pop * 7);
    bubble.fill({ color: 0xe9d5ff, alpha: 0.34 * (1 - pop) });
    bubble.stroke({
      color: 0xfdf4ff,
      alpha: 0.9 * (1 - pop),
      width: 2.4,
    });
  }

  if (sparkles) {
    sparkles.clear();
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2 + 0.2;
      const distance = 8 + 28 * pop;
      const x = Math.cos(angle) * distance;
      const y = -34 + Math.sin(angle) * distance * 0.7;
      const size = 2 + (index % 3) * 0.8;
      sparkles.poly([x, y - size, x + size, y, x, y + size, x - size, y]);
      sparkles.fill({
        color: index % 2 === 0 ? 0xf0abfc : 0xc4b5fd,
        alpha: 0.9 * fade,
      });
    }
  }

  container.alpha = fade;
}

function drawShikoQuake(container: PIXI.Container) {
  const impactDisc = new PIXI.Graphics();
  impactDisc.label = 'shiko_quake_disc';
  container.addChild(impactDisc);

  const impactStar = new PIXI.Graphics();
  impactStar.label = 'shiko_quake_star';
  container.addChild(impactStar);

  const dust = new PIXI.Graphics();
  dust.label = 'shiko_quake_dust';
  container.addChild(dust);

  const debris = new PIXI.Graphics();
  debris.label = 'shiko_quake_debris';
  container.addChild(debris);
}

function updateShikoQuake(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const impactDisc = container.getChildByLabel('shiko_quake_disc') as
    | PIXI.Graphics
    | undefined;
  const impactStar = container.getChildByLabel('shiko_quake_star') as
    | PIXI.Graphics
    | undefined;
  const dust = container.getChildByLabel('shiko_quake_dust') as
    | PIXI.Graphics
    | undefined;
  const debris = container.getChildByLabel('shiko_quake_debris') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 3.5);
  const radius = Math.max(3, maxRadius * expansion);
  const fade = 1 - Math.max(0, (progress - 0.58) / 0.42);

  if (impactDisc) {
    impactDisc.clear();
    impactDisc.ellipse(0, 5, radius, radius * 0.48);
    impactDisc.fill({ color: 0xc98b47, alpha: 0.2 * fade });
    impactDisc.ellipse(0, 5, radius * 0.58, radius * 0.27);
    impactDisc.fill({ color: 0xf5d29c, alpha: 0.24 * fade });
  }

  if (impactStar) {
    impactStar.clear();
    const starPoints: number[] = [];
    for (let index = 0; index < 16; index += 1) {
      const angle = -Math.PI / 2 + (index / 16) * Math.PI * 2;
      const pointRadius = radius * (index % 2 === 0 ? 0.48 : 0.2);
      starPoints.push(
        Math.cos(angle) * pointRadius,
        3 + Math.sin(angle) * pointRadius * 0.55
      );
    }
    impactStar.poly(starPoints);
    impactStar.fill({ color: 0xffedc7, alpha: 0.88 * fade });
  }

  if (dust) {
    dust.clear();
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      const distance = radius * (0.56 + (index % 3) * 0.12);
      const size = Math.max(2, radius * (0.045 + (index % 4) * 0.012));
      dust.circle(
        Math.cos(angle) * distance,
        5 + Math.sin(angle) * distance * 0.48,
        size
      );
      dust.fill({
        color: index % 2 === 0 ? 0xe8bc79 : 0xf8dfb3,
        alpha: (0.58 + (index % 3) * 0.1) * fade,
      });
    }
  }

  if (debris) {
    debris.clear();
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2 + 0.2;
      const distance = radius * (0.48 + progress * 0.34);
      const x = Math.cos(angle) * distance;
      const y = 4 + Math.sin(angle) * distance * 0.48 - progress * 10;
      const size = 2.5 + (index % 3) * 1.2;
      debris.poly([x, y - size, x + size, y, x, y + size, x - size, y]);
      debris.fill({ color: 0x7a4b2b, alpha: 0.78 * fade });
    }
  }

  container.alpha = fade;
}

function updateShikoStompHit(graphics: PIXI.Graphics, progress: number) {
  graphics.clear();
  const fade = 1 - progress;
  const radius = 7 + 12 * (1 - Math.pow(1 - progress, 2));
  graphics.ellipse(0, 0, radius, radius * 0.8).stroke({
    color: 0xffedc7,
    alpha: 0.95 * fade,
    width: 3,
  });
  graphics.circle(0, 0, Math.max(1, 7 * (1 - progress))).fill({
    color: 0xfff5d9,
    alpha: 0.85 * fade,
  });
  for (let index = 0; index < 4; index += 1) {
    const angle = (index * Math.PI) / 2 + Math.PI / 4;
    const inner = radius + 2;
    const outer = radius + 8;
    graphics.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    graphics.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    graphics.stroke({ color: 0xd99551, alpha: 0.9 * fade, width: 2.5 });
  }
}

function updateShikoQuakeTowerPose(
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  tower: Tower,
  elapsedTimeMs: number
) {
  sprite.rotation = 0;
  shadow.alpha = 1;
  shadow.scale.y = 1;
  const state = tower.shikoQuake;
  if (!state) return;

  const side =
    tower.facingDirection === 'left' || tower.facingDirection === 'up' ? -1 : 1;
  const baseX = sprite.x;
  const baseY = sprite.y;
  const baseScaleX = sprite.scale.x;
  const baseScaleY = sprite.scale.y;
  const baseShadowScaleX = shadow.scale.x;

  if (elapsedTimeMs < state.impactAtMs) {
    const windupDuration = state.impactAtMs - state.startedAtMs;
    const progress = Math.max(
      0,
      Math.min(1, (elapsedTimeMs - state.startedAtMs) / windupDuration)
    );
    if (progress < 0.56) {
      const anticipation = 1 - Math.pow(1 - progress / 0.56, 2);
      sprite.x = baseX + side * 5 * anticipation;
      sprite.y = baseY + 4 * anticipation;
      sprite.rotation = side * 0.12 * anticipation;
      sprite.scale.x = baseScaleX * (1 + 0.04 * anticipation);
      sprite.scale.y = baseScaleY * (1 - 0.05 * anticipation);
    } else {
      const hopProgress = (progress - 0.56) / 0.44;
      const hopHeight = Math.sin(hopProgress * Math.PI) * 13;
      sprite.x = baseX + side * 5 * (1 - hopProgress);
      sprite.y = baseY + 4 * (1 - hopProgress) - hopHeight;
      sprite.rotation = side * 0.12 * (1 - hopProgress);
      shadow.alpha = 1 - Math.sin(hopProgress * Math.PI) * 0.45;
      shadow.scale.x =
        baseShadowScaleX * (1 - Math.sin(hopProgress * Math.PI) * 0.22);
      shadow.scale.y = 1 - Math.sin(hopProgress * Math.PI) * 0.28;
    }
    return;
  }

  const recoveryDuration = state.endsAtMs - state.impactAtMs;
  const recovery = Math.max(
    0,
    Math.min(1, (elapsedTimeMs - state.impactAtMs) / recoveryDuration)
  );
  const squash = Math.max(0, 1 - recovery / 0.32);
  const settle = Math.exp(-4.5 * recovery) * Math.sin(recovery * Math.PI * 3);
  sprite.y = baseY + 6 * squash - 2 * settle;
  sprite.rotation = -side * 0.04 * squash;
  sprite.scale.x = baseScaleX * (1 + 0.11 * squash);
  sprite.scale.y = baseScaleY * (1 - 0.15 * squash);
  shadow.scale.x = baseShadowScaleX * (1 + 0.12 * squash);
  shadow.scale.y = 1 + 0.08 * squash;
}

function updatePalmSlamTowerPose(
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  tower: Tower,
  elapsedTimeMs: number
) {
  const state = tower.palmSlam;
  if (!state) return;

  const side =
    tower.facingDirection === 'left' || tower.facingDirection === 'up' ? -1 : 1;
  const baseX = sprite.x;
  const baseY = sprite.y;
  const baseScaleX = sprite.scale.x;
  const baseScaleY = sprite.scale.y;
  const baseShadowScaleX = shadow.scale.x;

  if (elapsedTimeMs < state.impactAtMs) {
    const windup = Math.max(
      0,
      Math.min(
        1,
        (elapsedTimeMs - state.startedAtMs) /
          (state.impactAtMs - state.startedAtMs)
      )
    );
    const brace = 1 - Math.pow(1 - windup, 2);
    sprite.x = baseX - side * 7 * brace;
    sprite.y = baseY + 3 * brace;
    sprite.rotation = -side * 0.09 * brace;
    sprite.scale.x = baseScaleX * (1 - 0.06 * brace);
    sprite.scale.y = baseScaleY * (1 - 0.04 * brace);
    shadow.scale.x = baseShadowScaleX * (1 + 0.08 * brace);
    return;
  }

  const recovery = Math.max(
    0,
    Math.min(
      1,
      (elapsedTimeMs - state.impactAtMs) / (state.endsAtMs - state.impactAtMs)
    )
  );
  const strike = 1 - recovery;
  sprite.x = baseX + side * 10 * strike;
  sprite.y = baseY + 4 * strike;
  sprite.rotation = side * 0.07 * strike;
  sprite.scale.x = baseScaleX * (1 + 0.13 * strike);
  sprite.scale.y = baseScaleY * (1 - 0.09 * strike);
  shadow.scale.x = baseShadowScaleX * (1 + 0.1 * strike);
}

function drawHowl(container: PIXI.Container) {
  const rings = new PIXI.Graphics();
  rings.label = 'howl_rings';
  container.addChild(rings);

  const accents = new PIXI.Graphics();
  accents.label = 'howl_accents';
  container.addChild(accents);
}

function updateHowl(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const rings = container.getChildByLabel('howl_rings') as
    | PIXI.Graphics
    | undefined;
  const accents = container.getChildByLabel('howl_accents') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 2.6);
  const fade = 1 - Math.max(0, (progress - 0.68) / 0.32);
  const radius = Math.max(3, maxRadius * expansion);

  if (rings) {
    rings.clear();
    for (let index = 0; index < 3; index += 1) {
      const ringRadius = radius * (0.56 + index * 0.2);
      rings.circle(0, 0, ringRadius);
      rings.stroke({
        color: index === 1 ? 0xfacc15 : 0x67e8f9,
        width: 4 - index * 0.7,
        alpha: fade * (0.9 - index * 0.16),
      });
    }
  }

  if (accents) {
    accents.clear();
    for (let index = 0; index < 10; index += 1) {
      const angle = index * 2.399 + progress * 0.8;
      const innerRadius = radius * 0.72;
      const outerRadius = innerRadius + 8 + (index % 3) * 4;
      accents.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      accents.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
    }
    accents.stroke({ color: 0xfef08a, width: 3, alpha: fade * 0.75 });
  }
}

function updateWindGust(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const haze = container.getChildByLabel('wind_gust_haze') as
    | PIXI.Graphics
    | undefined;
  const rings = container.getChildByLabel('wind_gust_rings') as
    | PIXI.Graphics
    | undefined;
  const streaks = container.getChildByLabel('wind_gust_streaks') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 3);
  const radius = Math.max(2, maxRadius * expansion);
  const fade = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const opacity = 1 - fade;

  if (haze) {
    haze.clear();
    haze.circle(0, 0, radius * 0.82);
    haze.fill({ color: 0xdff7ff, alpha: 0.07 * opacity });
  }

  if (rings) {
    rings.clear();
    for (let index = 0; index < 8; index += 1) {
      const ringRadius = radius * (0.25 + index * 0.1);
      const start = index * 0.83 + progress * 4.5;
      rings.arc(0, 0, ringRadius, start, start + 1.3);
    }
    rings.stroke({ color: 0xd8f5ff, width: 4, alpha: 0.72 * opacity });
  }

  if (streaks) {
    streaks.clear();
    for (let index = 0; index < 20; index += 1) {
      const angle = index * 2.399 + progress * 3.4;
      const distance = radius * (0.3 + (index % 7) * 0.095);
      const length = 8 + (index % 5) * 3;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const tangentX = -Math.sin(angle) * length;
      const tangentY = Math.cos(angle) * length;
      streaks.moveTo(x - tangentX, y - tangentY);
      streaks.quadraticCurveTo(
        x + Math.cos(angle) * 3,
        y + Math.sin(angle) * 3,
        x + tangentX,
        y + tangentY
      );
    }
    streaks.stroke({ color: 0xffffff, width: 2.5, alpha: 0.8 * opacity });
  }

  container.rotation = progress * 0.32;
  container.alpha = opacity;
}

function updateFunnyDance(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const haze = container.getChildByLabel('funny_dance_haze') as
    | PIXI.Graphics
    | undefined;
  const motionLines = container.getChildByLabel('funny_dance_motion_lines') as
    | PIXI.Graphics
    | undefined;
  const notes = container.getChildByLabel('funny_dance_notes') as
    | PIXI.Graphics
    | undefined;
  const entrance = Math.min(1, progress / 0.24);
  const expansion = 1 - Math.pow(1 - entrance, 3);
  const fade = 1 - Math.max(0, (progress - 0.7) / 0.3);
  const radius = Math.max(4, maxRadius * expansion);
  const palette = [0xfb7185, 0xfacc15, 0x4ade80, 0x38bdf8, 0xc084fc];

  if (haze) {
    haze.clear();
    haze.circle(0, 0, radius * 0.92);
    haze.fill({ color: 0xfdf4ff, alpha: 0.075 * fade });
    haze.circle(0, 0, radius * 0.58);
    haze.fill({ color: 0xfef3c7, alpha: 0.08 * fade });
  }

  if (motionLines) {
    motionLines.clear();
    for (let index = 0; index < 15; index += 1) {
      const angle = (index / 15) * Math.PI * 2 + progress * 1.8;
      const distance = radius * (0.28 + (index % 5) * 0.13);
      const length = 10 + (index % 4) * 4;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance * 0.72;
      const tangentX = -Math.sin(angle) * length;
      const tangentY = Math.cos(angle) * length * 0.72;
      motionLines.moveTo(x - tangentX, y - tangentY);
      motionLines.quadraticCurveTo(
        x + Math.cos(angle) * 7,
        y + Math.sin(angle) * 5,
        x + tangentX,
        y + tangentY
      );
      motionLines.stroke({
        color: palette[index % palette.length],
        width: 2.4,
        alpha: 0.76 * fade,
        cap: 'round',
      });
    }
  }

  if (notes) {
    notes.clear();
    for (let index = 0; index < 12; index += 1) {
      const angle = index * 2.399 + progress * (1.8 + (index % 3) * 0.3);
      const distance = radius * (0.2 + (index % 6) * 0.12);
      const bob = Math.sin(progress * Math.PI * 5 + index) * 4;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance * 0.7 - 8 - progress * 10 + bob;
      const size = 2.8 + (index % 3) * 0.6;
      const color = palette[(index + 2) % palette.length];

      notes.ellipse(x, y, size * 1.25, size);
      notes.fill({ color, alpha: 0.94 * fade });
      notes.moveTo(x + size, y - 1);
      notes.lineTo(x + size, y - 10 - size);
      notes.stroke({ color, width: 2.2, alpha: 0.94 * fade, cap: 'round' });
      if (index % 2 === 0) {
        notes.moveTo(x + size, y - 10 - size);
        notes.quadraticCurveTo(
          x + size + 7,
          y - 9 - size,
          x + size + 6,
          y - 4 - size
        );
        notes.stroke({
          color,
          width: 2.2,
          alpha: 0.94 * fade,
          cap: 'round',
        });
      }
    }
  }

  container.alpha = fade;
}

function drawFlyingColorsImpact(container: PIXI.Container) {
  const burst = new PIXI.Graphics();
  burst.label = 'flying_colors_burst';
  container.addChild(burst);
}

function updateFlyingColorsImpact(container: PIXI.Container, progress: number) {
  const burst = container.getChildByLabel('flying_colors_burst') as
    | PIXI.Graphics
    | undefined;
  if (!burst) return;

  const palette = [0xfb7185, 0xfacc15, 0x4ade80, 0x38bdf8, 0xc084fc];
  const radius = 3 + progress * 18;
  const fade = 1 - progress;
  burst.clear();
  burst.circle(0, 0, 4 + progress * 2);
  burst.fill({ color: 0xfff7ed, alpha: 0.55 * fade });
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2 + progress * 0.35;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.72;
    const tipX = x + Math.cos(angle) * 7;
    const tipY = y + Math.sin(angle) * 7;
    const sideX = -Math.sin(angle) * 2.5;
    const sideY = Math.cos(angle) * 2.5;
    burst.moveTo(x + sideX, y + sideY);
    burst.quadraticCurveTo(tipX, tipY, x - sideX, y - sideY);
    burst.quadraticCurveTo(
      x - Math.cos(angle) * 3,
      y - Math.sin(angle) * 3,
      x + sideX,
      y + sideY
    );
    burst.fill({ color: palette[index % palette.length], alpha: 0.8 * fade });
  }
  container.alpha = fade;
}

function drawToxicPollen(container: PIXI.Container) {
  const haze = new PIXI.Graphics();
  haze.label = 'toxic_pollen_haze';
  container.addChild(haze);

  const bloom = new PIXI.Graphics();
  bloom.label = 'toxic_pollen_bloom';
  container.addChild(bloom);

  const motes = new PIXI.Graphics();
  motes.label = 'toxic_pollen_motes';
  container.addChild(motes);
}

function updateToxicPollen(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const haze = container.getChildByLabel('toxic_pollen_haze') as
    | PIXI.Graphics
    | undefined;
  const bloom = container.getChildByLabel('toxic_pollen_bloom') as
    | PIXI.Graphics
    | undefined;
  const motes = container.getChildByLabel('toxic_pollen_motes') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 3);
  const radius = Math.max(2, maxRadius * expansion);
  const fade = Math.min(1, Math.max(0, (progress - 0.68) / 0.32));
  const opacity = 1 - fade;

  if (haze) {
    haze.clear();
    haze.circle(0, 0, radius * 0.88);
    haze.fill({ color: 0xa855f7, alpha: 0.1 * opacity });
    haze.circle(0, 0, radius * 0.58);
    haze.fill({ color: 0xd9f99d, alpha: 0.12 * opacity });
  }

  if (bloom) {
    bloom.clear();
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2 + progress * 0.35;
      const petalRadius = radius * 0.38;
      bloom.ellipse(
        Math.cos(angle) * petalRadius,
        Math.sin(angle) * petalRadius,
        radius * 0.34,
        radius * 0.17
      );
    }
    bloom.stroke({ color: 0xe879f9, width: 3, alpha: 0.52 * opacity });
  }

  if (motes) {
    motes.clear();
    for (let index = 0; index < 30; index += 1) {
      const angle = index * 2.399 + progress * (0.8 + (index % 3) * 0.12);
      const distance = radius * (0.2 + (index % 9) * 0.085);
      const size = 1.8 + (index % 4) * 0.75;
      motes.circle(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        size
      );
      motes.fill({
        color: index % 3 === 0 ? 0xf0abfc : 0xd9f99d,
        alpha: (0.58 + (index % 4) * 0.08) * opacity,
      });
    }
  }

  container.alpha = opacity;
}

function drawHarden(container: PIXI.Container) {
  const overlay = new PIXI.Graphics();
  overlay.label = 'harden_overlay';
  container.addChild(overlay);

  const plates = new PIXI.Graphics();
  plates.label = 'harden_plates';
  container.addChild(plates);

  const glints = new PIXI.Graphics();
  glints.label = 'harden_glints';
  container.addChild(glints);
}

function updateHarden(container: PIXI.Container, progress: number) {
  const overlay = container.getChildByLabel('harden_overlay') as
    | PIXI.Graphics
    | undefined;
  const plates = container.getChildByLabel('harden_plates') as
    | PIXI.Graphics
    | undefined;
  const glints = container.getChildByLabel('harden_glints') as
    | PIXI.Graphics
    | undefined;
  const lockIn = 1 - Math.pow(1 - Math.min(1, progress / 0.42), 3);
  const fade = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const opacity = 1 - fade;
  const shellRadius = 50 - lockIn * 10;

  if (overlay) {
    overlay.clear();
    overlay.moveTo(0, -46);
    overlay.lineTo(34, -30);
    overlay.lineTo(43, 5);
    overlay.lineTo(24, 36);
    overlay.lineTo(0, 48);
    overlay.lineTo(-24, 36);
    overlay.lineTo(-43, 5);
    overlay.lineTo(-34, -30);
    overlay.closePath();
    overlay.fill({ color: 0x94a3b8, alpha: 0.2 * lockIn * opacity });
    overlay.stroke({
      color: 0xf8fafc,
      width: 2.5,
      alpha: 0.78 * opacity,
      join: 'round',
    });
  }

  if (plates) {
    plates.clear();
    for (let index = 0; index < 8; index += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / 8;
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const radialX = Math.cos(angle);
      const radialY = Math.sin(angle);
      const radius = shellRadius + (1 - lockIn) * (16 + (index % 2) * 7);
      const x = radialX * radius;
      const y = radialY * radius;
      const halfWidth = 11;
      const halfDepth = 5.5;
      plates.moveTo(
        x - tangentX * halfWidth - radialX * halfDepth,
        y - tangentY * halfWidth - radialY * halfDepth
      );
      plates.lineTo(
        x + tangentX * halfWidth - radialX * halfDepth,
        y + tangentY * halfWidth - radialY * halfDepth
      );
      plates.lineTo(
        x + tangentX * (halfWidth - 3) + radialX * halfDepth,
        y + tangentY * (halfWidth - 3) + radialY * halfDepth
      );
      plates.lineTo(
        x - tangentX * (halfWidth - 3) + radialX * halfDepth,
        y - tangentY * (halfWidth - 3) + radialY * halfDepth
      );
      plates.closePath();
      plates.fill({
        color: index % 2 === 0 ? 0x64748b : 0x94a3b8,
        alpha: 0.9 * opacity,
      });
      plates.stroke({ color: 0xe2e8f0, width: 1.5, alpha: 0.9 * opacity });
    }
  }

  if (glints) {
    glints.clear();
    const glintProgress = Math.min(1, Math.max(0, (progress - 0.25) / 0.35));
    const glintAlpha = Math.sin(glintProgress * Math.PI) * opacity;
    const glintX = -30 + glintProgress * 60;
    const glintY = -30 + glintProgress * 18;
    glints.moveTo(glintX - 9, glintY);
    glints.lineTo(glintX + 9, glintY);
    glints.moveTo(glintX, glintY - 12);
    glints.lineTo(glintX, glintY + 12);
    glints.stroke({ color: 0xffffff, width: 3, alpha: glintAlpha });
  }

  const impactPulse =
    1 + Math.sin(Math.min(1, progress / 0.5) * Math.PI) * 0.08;
  overlay?.scale.set(impactPulse);
  plates?.scale.set(impactPulse);
  glints?.scale.set(impactPulse);
  container.alpha = opacity;
}

function spawnCursedFlame(
  aura: PIXI.Container,
  spriteWidth: number,
  spriteHeight: number
) {
  const flame = new PIXI.Graphics() as CursedFlame;
  flame.label = 'cursedFlame';
  flame.age = 0;
  flame.maxLife = 38 + Math.random() * 28;
  flame.life = flame.maxLife;
  flame.vx = (Math.random() - 0.5) * 0.18;
  flame.vy = -(0.22 + Math.random() * 0.28);
  flame.phase = Math.random() * Math.PI * 2;
  flame.wobbleSpeed = 0.08 + Math.random() * 0.06;
  flame.baseScale = 0.62 + Math.random() * 0.48;

  const spawnOnSide = Math.random() < 0.58;
  if (spawnOnSide) {
    const side = Math.random() < 0.5 ? -1 : 1;
    flame.x = side * spriteWidth * (0.4 + Math.random() * 0.12);
    flame.y = (Math.random() - 0.5) * spriteHeight * 0.78;
  } else {
    flame.x = (Math.random() - 0.5) * spriteWidth * 0.82;
    flame.y = spriteHeight * (0.24 + Math.random() * 0.18);
  }

  drawCursedFlame(flame, 6 + Math.random() * 5);
  aura.addChild(flame);
}

/**
 * Tints a cursed unit purple and surrounds its silhouette with rising,
 * flickering purple flames. The effect sizes itself from the current sprite.
 */
function updateCursedAura(
  container: PIXI.Container,
  unit: BaseTDUnit,
  sprite: PIXI.Sprite,
  delta: number
) {
  let aura = container.getChildByLabel('cursedAura') as
    | CursedAuraContainer
    | undefined;

  if (!unit.isCursed) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  // The hit's light elemental flash takes priority; cursed tint returns after.
  if ((unit.damageFlashTimerMs || 0) <= 0) {
    sprite.tint = 0xc084fc;
  }

  if (!aura) {
    aura = new PIXI.Container() as CursedAuraContainer;
    aura.label = 'cursedAura';
    aura.elapsed = 0;

    // Keep the aura above the ground shadow but behind the creature artwork.
    container.addChildAt(aura, container.getChildIndex(sprite));
  }

  aura.elapsed += delta;
  aura.position.set(sprite.x, sprite.y);

  const spriteWidth = sprite.texture.width * Math.abs(sprite.scale.x);
  const spriteHeight = sprite.texture.height * Math.abs(sprite.scale.y);
  const effectWidth = Math.max(72, spriteWidth);
  const effectHeight = Math.max(42, spriteHeight);

  const flames = [...aura.children] as CursedFlame[];
  for (const flame of flames) {
    flame.age += delta;
    flame.life -= delta;
    if (flame.life <= 0) {
      aura.removeChild(flame);
      flame.destroy();
      continue;
    }

    flame.x +=
      (flame.vx +
        Math.sin(flame.age * flame.wobbleSpeed + flame.phase) * 0.11) *
      delta;
    flame.y += flame.vy * delta;
    flame.rotation =
      Math.sin(flame.age * flame.wobbleSpeed + flame.phase) * 0.16;

    const lifeRatio = flame.life / flame.maxLife;
    const fadeIn = Math.min(1, flame.age / 7);
    flame.alpha = fadeIn * Math.min(1, lifeRatio * 1.65);
    const flicker = 1 + Math.sin(flame.age * 0.32 + flame.phase) * 0.1;
    flame.scale.set(flame.baseScale * (0.65 + lifeRatio * 0.4) * flicker);
  }

  if (aura.children.length === 0) {
    for (let index = 0; index < 7; index++) {
      spawnCursedFlame(aura, effectWidth, effectHeight);
      const flame = aura.children[aura.children.length - 1] as CursedFlame;
      flame.age = Math.random() * flame.maxLife * 0.75;
      flame.life = flame.maxLife - flame.age;
    }
  }

  if (aura.children.length < 14 && Math.random() < Math.min(0.5, delta * 0.3)) {
    spawnCursedFlame(aura, effectWidth, effectHeight);
  }
}

type DrenchedDroplet = PIXI.Graphics & {
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
};

type DrenchedAura = PIXI.Container;

function drawDrenchedDroplet(droplet: PIXI.Graphics) {
  droplet.moveTo(0, -7);
  droplet.bezierCurveTo(6, -1, 5, 6, 0, 7);
  droplet.bezierCurveTo(-5, 6, -6, -1, 0, -7);
  droplet.fill({ color: 0x0ea5e9, alpha: 0.82 });
  droplet.ellipse(1.4, -1.8, 1.6, 2.2);
  droplet.fill({ color: 0xbae6fd, alpha: 0.9 });
}

function spawnDrenchedDroplet(aura: DrenchedAura) {
  const droplet = new PIXI.Graphics() as DrenchedDroplet;
  droplet.maxLife = 34 + Math.random() * 30;
  droplet.life = droplet.maxLife;
  droplet.vx = (Math.random() - 0.5) * 0.18;
  droplet.vy = 0.42 + Math.random() * 0.55;
  droplet.x = (Math.random() - 0.5) * 58;
  droplet.y = -48 + Math.random() * 36;
  const scale = 0.42 + Math.random() * 0.38;
  droplet.scale.set(scale);
  drawDrenchedDroplet(droplet);
  aura.addChild(droplet);
}

function updateDrenchedAura(
  container: PIXI.Container,
  enemy: Enemy,
  sprite: PIXI.Sprite,
  delta: number
) {
  const isDrenched = enemy.statusConditions.some(
    (status) => status.type === 'DRENCHED'
  );
  let aura = container.getChildByLabel('drenchedAura') as
    | DrenchedAura
    | undefined;

  if (!isDrenched) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  if ((enemy.damageFlashTimerMs || 0) <= 0) {
    sprite.tint = 0x67c7f7;
  }

  if (!aura) {
    aura = new PIXI.Container() as DrenchedAura;
    aura.label = 'drenchedAura';
    for (let index = 0; index < 6; index += 1) {
      spawnDrenchedDroplet(aura);
      const droplet = aura.children[
        aura.children.length - 1
      ] as DrenchedDroplet;
      droplet.life -= Math.random() * droplet.maxLife * 0.65;
    }
    container.addChild(aura);
  }

  for (const child of [...aura.children]) {
    const droplet = child as DrenchedDroplet;
    droplet.life -= delta;
    if (droplet.life <= 0) {
      aura.removeChild(droplet);
      droplet.destroy();
      continue;
    }
    droplet.x += droplet.vx * delta;
    droplet.y += droplet.vy * delta;
    const lifeRatio = droplet.life / droplet.maxLife;
    droplet.alpha = Math.min(1, lifeRatio * 1.8);
  }

  if (
    aura.children.length < 10 &&
    Math.random() < Math.min(0.75, delta * 0.3)
  ) {
    spawnDrenchedDroplet(aura);
  }
}

type PoisonIndicator = PIXI.Container & {
  elapsed: number;
  poisonSignature: string;
};

function drawPoisonPollenIcon(graphics: PIXI.Graphics) {
  const spores = [
    { x: -3.5, y: 2.5, radius: 3.6 },
    { x: 3.4, y: 2.2, radius: 3.2 },
    { x: 0, y: -3.4, radius: 3.8 },
  ];

  spores.forEach(({ x, y, radius }, index) => {
    graphics.circle(x, y, radius);
    graphics.fill({
      color: index === 1 ? 0xd9f99d : 0xc084fc,
      alpha: 0.98,
    });
    graphics.circle(x - radius * 0.25, y - radius * 0.3, radius * 0.28);
    graphics.fill({ color: 0xffffff, alpha: 0.72 });
  });
}

function drawVenomSprayIcon(graphics: PIXI.Graphics) {
  graphics.moveTo(0, -7.5);
  graphics.bezierCurveTo(5.5, -2, 6.7, 2.5, 3.2, 5.7);
  graphics.bezierCurveTo(1.4, 7.4, -1.5, 7.4, -3.3, 5.7);
  graphics.bezierCurveTo(-6.7, 2.5, -5.5, -2, 0, -7.5);
  graphics.fill({ color: 0xc084fc, alpha: 0.98 });
  graphics.stroke({ color: 0xf5d0fe, alpha: 0.95, width: 1.2 });
  graphics.circle(-1.8, 0.3, 1.5);
  graphics.fill({ color: 0xffffff, alpha: 0.72 });
}

function getPoisonSortOrder(status: StatusCondition) {
  if (status.poisonId === TOXIC_POLLEN_POISON_ID) return 0;
  if (status.poisonId === VENOM_SPRAY_POISON_ID) return 1;
  return 2;
}

function createPoisonBadge(status: StatusCondition, index: number) {
  const badgeContainer = new PIXI.Container();
  badgeContainer.label = `poisonBadge_${index}`;
  badgeContainer.position.x = index * 28;
  const isVenom = status.poisonId === VENOM_SPRAY_POISON_ID;

  const badge = new PIXI.Graphics();
  badge.circle(0, 0, 11);
  badge.fill({ color: isVenom ? 0x2e1065 : 0x3b0764, alpha: 0.94 });
  badge.stroke({
    color: isVenom ? 0xa3e635 : 0xe879f9,
    alpha: 0.98,
    width: 2,
  });
  badgeContainer.addChild(badge);

  const icon = new PIXI.Graphics();
  icon.label = isVenom ? 'venomSprayIcon' : 'toxicPollenIcon';
  if (isVenom) drawVenomSprayIcon(icon);
  else drawPoisonPollenIcon(icon);
  badgeContainer.addChild(icon);

  if (isVenom) {
    const stackBadge = new PIXI.Graphics();
    stackBadge.label = `poisonStackBadge_${index}`;
    stackBadge.roundRect(5, 4, 20, 15, 7.5);
    stackBadge.fill({ color: 0x581c87, alpha: 0.98 });
    stackBadge.stroke({ color: 0xd9f99d, alpha: 0.96, width: 1.5 });
    badgeContainer.addChild(stackBadge);

    const stackText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xf7fee7,
        stroke: { color: 0x3b0764, width: 2 },
      },
    });
    stackText.label = `poisonStackText_${index}`;
    stackText.anchor.set(0.5);
    stackText.position.set(15, 11.5);
    badgeContainer.addChild(stackText);
  }

  return badgeContainer;
}

/** Persistent Poison treatment: a shared tint plus one badge per poison variant. */
function updatePoisonIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  sprite: PIXI.Sprite,
  configId: SpeciesId | string,
  delta: number
) {
  const poisons = getActivePoisons(enemy).sort(
    (left, right) => getPoisonSortOrder(left) - getPoisonSortOrder(right)
  );
  const poisonSignature = poisons
    .map((status) => status.poisonId ?? 'GENERIC')
    .join('|');
  let indicator = container.getChildByLabel('poisonIndicator') as
    | PoisonIndicator
    | undefined;

  if (poisons.length === 0) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (indicator && indicator.poisonSignature !== poisonSignature) {
    container.removeChild(indicator);
    indicator.destroy({ children: true });
    indicator = undefined;
  }

  // Damage flashes briefly take visual priority; the poison tint returns after.
  if ((enemy.damageFlashTimerMs || 0) <= 0) {
    sprite.tint = 0xd8b4fe;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as PoisonIndicator;
    indicator.label = 'poisonIndicator';
    indicator.elapsed = 0;
    indicator.poisonSignature = poisonSignature;
    poisons.forEach((poison, index) => {
      indicator!.addChild(createPoisonBadge(poison, index));
    });

    container.addChild(indicator);
  }

  indicator.elapsed += delta;
  const tdConfigMap = getDefinitionVisuals(configId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[enemy.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  indicator.position.set(-33 - (poisons.length - 1) * 14, hpOffsetY - 13);

  const pulse = 1 + Math.sin(indicator.elapsed * 0.11) * 0.055;
  indicator.scale.set(pulse);
  indicator.alpha = 0.9 + Math.sin(indicator.elapsed * 0.075) * 0.1;

  poisons.forEach((poison, index) => {
    if (poison.poisonId !== VENOM_SPRAY_POISON_ID) return;
    const poisonBadge = indicator!.getChildByLabel(`poisonBadge_${index}`) as
      | PIXI.Container
      | undefined;
    const stackBadge = poisonBadge?.getChildByLabel(
      `poisonStackBadge_${index}`
    ) as PIXI.Graphics | undefined;
    const stackText = poisonBadge?.getChildByLabel(
      `poisonStackText_${index}`
    ) as PIXI.Text | undefined;
    const stackCount = Math.max(1, poison.stackCount ?? 1);
    if (stackBadge) stackBadge.visible = stackCount > 1;
    if (stackText) {
      stackText.visible = stackCount > 1;
      stackText.text = stackCount > 1 ? `×${stackCount}` : '';
    }
  });
}

function createDreamBubbleIndicator(label: string) {
  const indicator = new PIXI.Container();
  indicator.label = label;

  const bubble = new PIXI.Graphics();
  bubble.circle(0, 0, 13);
  bubble.fill({ color: 0xe9d5ff, alpha: 0.9 });
  bubble.stroke({ color: 0xffffff, alpha: 0.96, width: 2 });
  bubble.circle(-4, -4, 3.5);
  bubble.fill({ color: 0xffffff, alpha: 0.76 });
  bubble.circle(-12, 12, 4.2);
  bubble.fill({ color: 0xd8b4fe, alpha: 0.82 });
  bubble.circle(-18, 18, 2.5);
  bubble.fill({ color: 0xc4b5fd, alpha: 0.72 });
  indicator.addChild(bubble);

  const text = new PIXI.Text({
    text: 'Z',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0x6d28d9,
      stroke: { color: 0xfdf4ff, width: 1.5 },
    },
  });
  text.anchor.set(0.5);
  text.position.set(1, 1);
  indicator.addChild(text);
  return indicator;
}

function getStatusIndicatorOffsetY(configId: SpeciesId | string, enemy: Enemy) {
  const tdConfigMap = getDefinitionVisuals(configId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[enemy.facingDirection] || tdConfigMap.default;
  return (
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40
  );
}

function updateSleepIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  sprite: PIXI.Sprite,
  configId: SpeciesId | string,
  elapsedTimeMs: number
) {
  const isAsleep = enemy.statusConditions.some(
    (status) => status.type === 'SLEEP'
  );
  let indicator = container.getChildByLabel('sleepIndicator') as
    | PIXI.Container
    | undefined;

  if (!isAsleep) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if ((enemy.damageFlashTimerMs ?? 0) <= 0) sprite.tint = 0xddd6fe;
  const breathing = Math.sin(elapsedTimeMs / 360);
  sprite.y += 2.5 + breathing * 1.2;
  sprite.rotation += breathing * 0.018;

  if (!indicator) {
    indicator = createDreamBubbleIndicator('sleepIndicator');
    container.addChild(indicator);
  }

  const hpOffsetY = getStatusIndicatorOffsetY(configId, enemy);
  indicator.position.set(29, hpOffsetY - 16 + breathing * 2);
  const pulse = 1 + Math.sin(elapsedTimeMs / 240) * 0.055;
  indicator.scale.set(pulse);
  indicator.alpha = 0.9 + Math.sin(elapsedTimeMs / 310) * 0.1;
}

function createSleepResistanceIndicator() {
  const indicator = new PIXI.Container();
  indicator.label = 'sleepResistanceIndicator';

  const badge = new PIXI.Graphics();
  badge.circle(0, 0, 10);
  badge.fill({ color: 0x312e81, alpha: 0.92 });
  badge.stroke({ color: 0xa78bfa, alpha: 0.95, width: 1.8 });
  badge.circle(-1.5, -0.5, 5.8);
  badge.fill({ color: 0xddd6fe, alpha: 0.95 });
  badge.circle(1.4, -2.5, 5.2);
  badge.fill({ color: 0x312e81, alpha: 1 });
  badge.moveTo(-5, -6);
  badge.lineTo(5, 6);
  badge.stroke({ color: 0xf0abfc, alpha: 0.96, width: 2.2 });
  indicator.addChild(badge);
  return indicator;
}

function updateSleepResistanceIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  configId: SpeciesId | string,
  elapsedTimeMs: number
) {
  const remainingMs = (enemy.sleepResistantUntilMs ?? 0) - elapsedTimeMs;
  const isAsleep = enemy.statusConditions.some(
    (status) => status.type === 'SLEEP'
  );
  let indicator = container.getChildByLabel('sleepResistanceIndicator') as
    | PIXI.Container
    | undefined;

  if (remainingMs <= 0 || isAsleep) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = createSleepResistanceIndicator();
    container.addChild(indicator);
  }

  const hpOffsetY = getStatusIndicatorOffsetY(configId, enemy);
  indicator.position.set(29, hpOffsetY - 14);
  const pulse = 1 + Math.sin(elapsedTimeMs / 300) * 0.04;
  indicator.scale.set(pulse);
  indicator.alpha = Math.min(0.9, Math.max(0.28, remainingMs / 700));
}

function updateSharedSlumberTowerVisual(
  container: PIXI.Container,
  sprite: PIXI.Sprite,
  shadow: PIXI.Graphics,
  tower: Tower,
  elapsedTimeMs: number
) {
  const isSleeping = (tower.sharedSlumberUntilMs ?? 0) > elapsedTimeMs;
  let indicator = container.getChildByLabel('sharedSlumberTowerIndicator') as
    | PIXI.Container
    | undefined;

  if (!isSleeping) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  const breathing = Math.sin(elapsedTimeMs / 420);
  sprite.y += 3.5 + breathing * 1.5;
  sprite.rotation += breathing * 0.022;
  sprite.scale.y *= 0.975;
  shadow.scale.x *= 1.04 + breathing * 0.02;
  if ((tower.damageFlashTimerMs ?? 0) <= 0) sprite.tint = 0xede9fe;

  if (!indicator) {
    indicator = createDreamBubbleIndicator('sharedSlumberTowerIndicator');
    indicator.scale.set(1.18);
    container.addChild(indicator);
  }

  const tdConfigMap = getDefinitionVisuals(tower.creature.speciesId) || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[tower.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  indicator.position.set(31, hpOffsetY - 20 + breathing * 2.5);
  const pulse = 1.18 + Math.sin(elapsedTimeMs / 280) * 0.07;
  indicator.scale.set(pulse);
  indicator.alpha = 0.92 + Math.sin(elapsedTimeMs / 330) * 0.08;
}

function updateTowerParalysisVisual(
  container: PIXI.Container,
  sprite: PIXI.Sprite,
  tower: Tower,
  elapsedTimeMs: number
) {
  let sparks = container.getChildByLabel('towerParalysisSparks') as
    | PIXI.Graphics
    | undefined;
  if ((tower.paralysis?.expiresAtMs ?? 0) <= elapsedTimeMs) {
    if (sparks) {
      container.removeChild(sparks);
      sparks.destroy();
    }
    return;
  }

  if (!sparks) {
    sparks = new PIXI.Graphics();
    sparks.label = 'towerParalysisSparks';
    container.addChild(sparks);
  }
  sparks.clear();
  sparks.position.set(sprite.x, sprite.y);
  const halfWidth = Math.max(24, Math.min(66, sprite.width * 0.42));
  const halfHeight = Math.max(26, Math.min(70, sprite.height * 0.4));
  const towerSeed = [...tower.id].reduce(
    (value, character) => value + character.charCodeAt(0),
    0
  );
  const flash = Math.floor((elapsedTimeMs + (towerSeed % 97)) / 105);
  const jitter = (seed: number) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };
  const anchors = [
    [-0.9, -0.38],
    [0.78, -0.65],
    [-0.63, 0.28],
    [0.92, 0.18],
    [-0.15, -0.85],
    [0.3, 0.65],
  ];

  for (let index = 0; index < anchors.length; index++) {
    const seed = flash * 17 + towerSeed + index * 31;
    if (jitter(seed + 1) < 0.26) continue;
    const [anchorX, anchorY] = anchors[index];
    const x = anchorX * halfWidth + (jitter(seed + 2) - 0.5) * 13;
    const y = anchorY * halfHeight + (jitter(seed + 3) - 0.5) * 11;
    const inward = anchorX < 0 ? 1 : -1;
    const bend = 5 + jitter(seed + 4) * 5;
    const length = 16 + jitter(seed + 5) * 11;
    const points = [
      [x, y - length * 0.5],
      [x + inward * bend, y - length * 0.17],
      [x - inward * 2, y + length * 0.12],
      [x + inward * (bend + 3), y + length * 0.5],
    ];
    const drawBolt = (width: number, color: number, alpha: number) => {
      sparks.moveTo(points[0][0], points[0][1]);
      for (let point = 1; point < points.length; point++) {
        sparks.lineTo(points[point][0], points[point][1]);
      }
      sparks.stroke({ color, width, alpha, cap: 'round', join: 'round' });
    };
    drawBolt(8, 0xf59e0b, 0.32);
    drawBolt(4, 0xfacc15, 0.98);
    drawBolt(1.5, 0xfffbd1, 0.95);
    sparks.moveTo(points[2][0], points[2][1]);
    sparks.lineTo(points[2][0] - inward * 7, points[2][1] + 5);
    sparks.lineTo(points[2][0] - inward * 3, points[2][1] + 10);
    sparks.stroke({ color: 0xfde047, width: 2, alpha: 0.9 });
  }
  sparks.alpha = flash % 4 === 3 ? 0.35 : 1;
  if (flash % 3 !== 2 && (tower.damageFlashTimerMs ?? 0) <= 0) {
    sprite.tint = 0xffec86;
  }
}

function updateFunnyDanceTowerPose(
  sprite: PIXI.Sprite,
  tower: Tower,
  elapsedTimeMs: number
) {
  const dance = tower.funnyDance;
  if (!dance || elapsedTimeMs >= dance.endsAtMs) return;

  const durationMs = Math.max(1, dance.endsAtMs - dance.startedAtMs);
  const progress = Math.max(
    0,
    Math.min(1, (elapsedTimeMs - dance.startedAtMs) / durationMs)
  );
  const envelope = Math.sin(progress * Math.PI);
  const sway = Math.sin(progress * Math.PI * 8);
  sprite.rotation += sway * 0.23 * envelope;
  sprite.y -= Math.abs(sway) * 2.5 * envelope;
}

function updateWakeWhipTowerPose(
  sprite: PIXI.Sprite,
  tower: Tower,
  elapsedTimeMs: number
) {
  const wakeWhip = tower.wakeWhip;
  if (!wakeWhip || wakeWhip.launched || elapsedTimeMs >= wakeWhip.launchAtMs) {
    return;
  }

  const durationMs = Math.max(1, wakeWhip.launchAtMs - wakeWhip.startedAtMs);
  const progress = Math.max(
    0,
    Math.min(1, (elapsedTimeMs - wakeWhip.startedAtMs) / durationMs)
  );
  const envelope = Math.sin(progress * Math.PI);
  const waggle = Math.sin(progress * Math.PI * 7);
  sprite.rotation += waggle * 0.085 * envelope;
  sprite.x += waggle * 3.5 * envelope;
  sprite.y -= Math.abs(waggle) * 1.3 * envelope;
}

function updateFunnyDanceEnemyPose(
  sprite: PIXI.Sprite,
  enemy: Enemy,
  elapsedTimeMs: number
) {
  const reaction = enemy.funnyDanceReaction;
  if (!reaction || elapsedTimeMs >= reaction.endsAtMs) return;

  const durationMs = Math.max(1, reaction.endsAtMs - reaction.startedAtMs);
  const progress = Math.max(
    0,
    Math.min(1, (elapsedTimeMs - reaction.startedAtMs) / durationMs)
  );
  const envelope = Math.sin(progress * Math.PI);
  sprite.rotation += Math.sin(progress * Math.PI * 6) * 0.1 * envelope;
}

const TYPE_COLORS: Record<ElementType, number> = {
  [ElementType.WATER]: 0x3b82f6,
  [ElementType.FIRE]: 0xef4444,
  [ElementType.GRASS]: 0x22c55e,
  [ElementType.BUG]: 0x65a30d,
  [ElementType.ROCK]: 0x8b6f47,
  [ElementType.GROUND]: 0xa16207,
  [ElementType.STEEL]: 0x64748b,
  [ElementType.POISON]: 0xa855f7,
  [ElementType.DARK]: 0x312e81,
  [ElementType.PSYCHIC]: 0xd946ef,
  [ElementType.ELECTRIC]: 0xeab308,
  [ElementType.NORMAL]: 0xa3a3a3,
  [ElementType.FIGHTING]: 0xb91c1c,
  [ElementType.FLYING]: 0x38bdf8,
};

type UrlTrackedSprite = PIXI.Sprite & { currentUrl?: string };

function updatePrisonGateTexture(
  sprite: UrlTrackedSprite,
  url: string,
  layout: TDStructureSpriteLayout
) {
  if (sprite.currentUrl !== url) {
    sprite.currentUrl = url;
    void PIXI.Assets.load(url).then((texture) => {
      if (sprite.currentUrl === url) sprite.texture = texture as PIXI.Texture;
    });
  }

  // All four PNGs share a common canvas so their silhouettes stay registered.
  sprite.anchor.set(0.5);
  sprite.position.set(layout.offsetX, layout.offsetY);
  sprite.width = layout.width;
  sprite.height = layout.height;
  sprite.rotation = ((layout.rotationDegrees ?? 0) * Math.PI) / 180;
  sprite.skew.set(
    ((layout.skewXDegrees ?? 0) * Math.PI) / 180,
    ((layout.skewYDegrees ?? 0) * Math.PI) / 180
  );
}

function updateRasterAttackSprite(
  sprite: UrlTrackedSprite,
  url: string,
  width: number,
  height: number,
  flipX = false
) {
  if (sprite.currentUrl !== url) {
    sprite.currentUrl = url;
    void PIXI.Assets.load(url).then((texture) => {
      if (!sprite.destroyed && sprite.currentUrl === url) {
        sprite.texture = texture as PIXI.Texture;
      }
    });
  }
  sprite.anchor.set(0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.scale.x = Math.abs(sprite.scale.x) * (flipX ? -1 : 1);
}

function updatePrisonGateVisual(container: PIXI.Container, enemy: Enemy) {
  let gate = container.getChildByLabel('prisonGate') as
    | UrlTrackedSprite
    | undefined;
  if (!gate) {
    gate = new PIXI.Sprite() as UrlTrackedSprite;
    gate.label = 'prisonGate';
    container.addChild(gate);
  }

  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  const textureUrl =
    hpRatio <= 0.33
      ? PRISON_GATE_TEXTURES.critical
      : hpRatio <= 0.66
        ? PRISON_GATE_TEXTURES.damaged
        : PRISON_GATE_TEXTURES.intact;
  const layout = resolvePrisonGateVisualLayout(enemy.structureVisualLayout);
  updatePrisonGateTexture(gate, textureUrl, layout.standing);

  if ((enemy.damageFlashTimerMs ?? 0) > 0) gate.alpha = 0.55;
  else gate.alpha = 1;
}

function updateScouredIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  elapsedTimeMs: number
) {
  let indicator = container.getChildByLabel('scouredIndicator') as
    | PIXI.Graphics
    | undefined;
  if (!indicator) {
    indicator = new PIXI.Graphics();
    indicator.label = 'scouredIndicator';
    container.addChild(indicator);
  }
  indicator.clear();
  const effect = enemy.scouredEffect;
  if (!effect || effect.expiresAtMs <= elapsedTimeMs) return;

  const pulse = 0.75 + Math.sin(elapsedTimeMs / 130) * 0.2;
  const isPrisonGate = enemy.structureVisualStyle === 'prison-gate';
  if (isPrisonGate) {
    const standing = resolvePrisonGateVisualLayout(
      enemy.structureVisualLayout
    ).standing;
    indicator.position.set(standing.offsetX, standing.offsetY);
    indicator.rotation = ((standing.rotationDegrees ?? 0) * Math.PI) / 180;
    indicator.skew.set(
      ((standing.skewXDegrees ?? 0) * Math.PI) / 180,
      ((standing.skewYDegrees ?? 0) * Math.PI) / 180
    );
    const left = -standing.width / 2;
    const top = -standing.height / 2;
    for (let index = 0; index < 11; index++) {
      const x = left + standing.width * (0.12 + ((index * 37) % 77) / 100);
      const y = top + standing.height * (0.1 + ((index * 23) % 78) / 100);
      const radius = 4 + (index % 3) * 2;
      indicator.circle(x, y, radius);
      indicator.fill({
        color: index % 2 === 0 ? 0xa3e635 : 0xd946ef,
        alpha: 0.35 + pulse * 0.25,
      });
      indicator.moveTo(x, y + radius);
      indicator.lineTo(x - 2, y + radius + 10 + (index % 4) * 3);
      indicator.stroke({ color: 0x84cc16, width: 3, alpha: 0.5 });
    }
    return;
  }

  indicator.position.set(0, 0);
  indicator.rotation = 0;
  indicator.skew.set(0, 0);
  const radius = enemy.kind === 'structure' ? 58 : 31;
  indicator.ellipse(
    0,
    enemy.kind === 'structure' ? -38 : 1,
    radius,
    radius * 0.48
  );
  indicator.stroke({ color: 0xa3e635, width: 4, alpha: 0.35 + pulse * 0.3 });
  for (let index = 0; index < 7; index++) {
    const angle = elapsedTimeMs / 850 + (index / 7) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.78;
    const y =
      (enemy.kind === 'structure' ? -38 : 1) + Math.sin(angle) * radius * 0.32;
    indicator.circle(x, y, 3 + (index % 2) * 2);
    indicator.fill({
      color: index % 2 === 0 ? 0xd946ef : 0xa3e635,
      alpha: 0.58 + pulse * 0.22,
    });
  }
}

function updateDestroyedPrisonGate(
  sprite: UrlTrackedSprite,
  remnant: DestroyedStructureVisual,
  elapsedTimeMs: number
) {
  const layout = resolvePrisonGateVisualLayout(remnant.visualLayout);
  updatePrisonGateTexture(sprite, PRISON_GATE_TEXTURES.rubble, layout.rubble);
  const ageMs = Math.max(0, elapsedTimeMs - remnant.destroyedAtMs);
  sprite.alpha = Math.min(1, ageMs / 180);
}

function getVisualPathPoint(
  path: { x: number; y: number }[],
  progress: number,
  width: number,
  height: number
): { x: number; y: number; angle: number } {
  if (path.length === 0) return { x: 0, y: 0, angle: 0 };
  const points = path.map((point) => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }));
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y)
    );
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * totalLength;

  for (let index = 1; index < points.length; index++) {
    const segmentLength = lengths[index - 1];
    if (segmentLength === 0) continue;
    if (remaining <= segmentLength) {
      const amount = remaining / segmentLength;
      return {
        x:
          points[index - 1].x +
          (points[index].x - points[index - 1].x) * amount,
        y:
          points[index - 1].y +
          (points[index].y - points[index - 1].y) * amount,
        angle: Math.atan2(
          points[index].y - points[index - 1].y,
          points[index].x - points[index - 1].x
        ),
      };
    }
    remaining -= segmentLength;
  }

  const lastPoint = points[points.length - 1];
  const previousPoint = points[Math.max(0, points.length - 2)];
  return {
    ...lastPoint,
    angle: Math.atan2(
      lastPoint.y - previousPoint.y,
      lastPoint.x - previousPoint.x
    ),
  };
}

function updateObjectiveAllyVisual(
  container: PIXI.Container,
  ally: ObjectiveAlly,
  elapsedTimeMs: number
) {
  const sprite = container.getChildByLabel('objectiveAllySprite') as
    | PIXI.Sprite
    | undefined;
  const marker = container.getChildByLabel('objectiveAllyMarker') as
    | PIXI.Graphics
    | undefined;
  const action = container.getChildByLabel('objectiveAllyAction') as
    | PIXI.Graphics
    | undefined;
  if (!sprite || !marker || !action) return;

  marker.clear();
  action.clear();
  sprite.rotation = 0;
  sprite.alpha = ally.phase === 'exhausted' ? 0.62 : 1;

  if (ally.phase !== 'locked') {
    marker.ellipse(0, 7, 34, 13);
    marker.fill({ color: 0x14b8a6, alpha: 0.16 });
    marker.stroke({ color: 0x5eead4, width: 3, alpha: 0.9 });
  }

  const phaseTime = elapsedTimeMs - ally.phaseStartedAtMs;
  if (ally.phase === 'bowing') {
    sprite.rotation = Math.sin(Math.min(1, phaseTime / 325) * Math.PI) * 0.08;
  } else if (ally.phase === 'windup') {
    const pulse = 1 + 0.15 * Math.sin(phaseTime / 70);
    action.circle(-1, -4, 26 * pulse);
    action.stroke({ color: 0xfb923c, width: 4, alpha: 0.75 });
    sprite.x += Math.sin(phaseTime / 35) * 2;
  } else if (ally.phase === 'charging') {
    for (const y of [-22, -9, 4]) {
      action.moveTo(-72, y);
      action.lineTo(-30, y + 5);
      action.stroke({ color: 0xfbbf24, width: 4, alpha: 0.75 });
    }
  } else if (ally.phase === 'assaulting') {
    const pulse = 1 + 0.1 * Math.sin(phaseTime / 90);
    action.circle(0, -4, 28 * pulse);
    action.stroke({ color: 0x8b5cf6, width: 4, alpha: 0.72 });
    for (const x of [-10, 0, 10]) {
      action.moveTo(x, -18);
      action.bezierCurveTo(x - 6, -35, x + 8, -48, x + 2, -66);
      action.stroke({ color: 0xc4b5fd, width: 3, alpha: 0.68 });
    }
  } else if (ally.phase === 'channeling') {
    const colors = [0x22d3ee, 0xf472b6, 0xfacc15, 0xa78bfa];
    action.circle(0, -4, 29 + Math.sin(phaseTime / 120) * 3);
    action.stroke({ color: 0x67e8f9, width: 4, alpha: 0.72 });
    for (let index = 0; index < 8; index++) {
      const angle = phaseTime / 900 + (index / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 38;
      const y = -4 + Math.sin(angle) * 19;
      const size = 4 + (index % 2);
      action.poly([x, y - size, x + size, y, x, y + size, x - size, y]);
      action.fill({ color: colors[index % colors.length], alpha: 0.82 });
    }
  } else if (ally.phase === 'volleying') {
    const fanPulse = 1 + Math.sin(phaseTime / 100) * 0.12;
    const colors = [0xd946ef, 0xa3e635, 0xc08457];
    for (let index = 0; index < 5; index++) {
      const angle = -Math.PI * 0.82 + (index / 4) * Math.PI * 0.64;
      const x = Math.cos(angle) * 34 * fanPulse;
      const y = -12 + Math.sin(angle) * 25 * fanPulse;
      action.moveTo(0, -8);
      action.lineTo(x, y);
      action.stroke({
        color: colors[index % colors.length],
        width: 5,
        alpha: 0.72,
      });
      action.circle(x, y, 4 + (index % 2));
      action.fill({ color: colors[index % colors.length], alpha: 0.82 });
    }
  } else if (ally.phase === 'exhausted') {
    sprite.rotation = -0.08;
  }
}

function updateStructureLabel(
  container: PIXI.Container,
  enemy: Enemy,
  isFocused: boolean
) {
  let target = container.getChildByLabel('structureTarget') as
    | PIXI.Graphics
    | undefined;
  if (!target) {
    target = new PIXI.Graphics();
    target.label = 'structureTarget';
    container.addChild(target);
  }
  target.clear();
  if (isFocused) {
    const isPrisonGate = enemy.structureVisualStyle === 'prison-gate';
    const layout = resolvePrisonGateVisualLayout(enemy.structureVisualLayout);
    const standing = layout.standing;
    target.roundRect(
      isPrisonGate ? standing.offsetX - standing.width / 2 - 4 : -52,
      isPrisonGate ? standing.offsetY - standing.height / 2 - 4 : -101,
      isPrisonGate ? standing.width + 8 : 104,
      isPrisonGate ? standing.height + 8 : 113,
      12
    );
    target.stroke({ color: 0xfacc15, width: 4, alpha: 0.95 });
  }
  let label = container.getChildByLabel('structureLabel') as
    | PIXI.Text
    | undefined;
  if (!label) {
    label = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xe2e8f0,
        stroke: { color: 0x0f172a, width: 3 },
      },
    });
    label.label = 'structureLabel';
    label.anchor.set(0.5);
    container.addChild(label);
  }

  const prisonGateLayout = resolvePrisonGateVisualLayout(
    enemy.structureVisualLayout
  );
  label.position.set(
    enemy.structureVisualStyle === 'prison-gate'
      ? prisonGateLayout.standing.offsetX
      : 0,
    enemy.structureVisualStyle === 'prison-gate'
      ? prisonGateLayout.labelOffsetY
      : -82
  );
  label.text = `${enemy.displayName ?? 'STRUCTURE'}  •  STEEL`;
  label.style.fill = isFocused ? 0xfde047 : 0xe2e8f0;
}

interface PixiBattlefieldProps {
  engine: TowerDefenseEngine;
  onMapDrop: (defId: string, x: number, y: number) => void;
  onMapRemove: (defId: string) => void;
  onEnemyCaptured?: (enemyId: string) => void;
  onStructureFocused?: (structureId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  getDragState?: () => 'tower' | 'capture' | false;
  dragSurfaceRef?: RefObject<HTMLDivElement | null>;
  backgroundUrl?: string;
  backgroundScale?: number;
  fitToScreen?: boolean;
  initialView?: TDInitialView;
  openingPan?: TDOpeningPan;
  onOpeningPanComplete?: () => void;
  hideUi?: boolean;
  /** Creature being guided toward Mari's recovery area by the first-heal lesson. */
  healingTutorialTowerCreatureId?: string;
}

export interface PixiBattlefieldRef {
  handleExternalMove: (
    clientX: number,
    clientY: number,
    type: 'tower' | 'capture',
    towerCreatureId?: string,
    pointerType?: string
  ) => void;
  handleExternalLeave: () => void;
  handleExternalDrop: (
    clientX: number,
    clientY: number,
    towerIdStr: string | null,
    isCaptureDevice: boolean,
    pointerType?: string
  ) => void;
}

const PixiBattlefield = forwardRef<PixiBattlefieldRef, PixiBattlefieldProps>(
  (
    {
      engine,
      onMapDrop,
      onMapRemove,
      onEnemyCaptured,
      onStructureFocused,
      onDragStateChange,
      getDragState,
      dragSurfaceRef,
      backgroundUrl,
      backgroundScale = 1,
      fitToScreen = false,
      initialView,
      openingPan,
      onOpeningPanComplete,
      hideUi = false,
      healingTutorialTowerCreatureId,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fpsRef = useRef<HTMLDivElement>(null);
    const onMapDropRef = useRef(onMapDrop);
    const onMapRemoveRef = useRef(onMapRemove);
    const onEnemyCapturedRef = useRef(onEnemyCaptured);
    const onStructureFocusedRef = useRef(onStructureFocused);
    const onDragStateChangeRef = useRef(onDragStateChange);
    const onOpeningPanCompleteRef = useRef(onOpeningPanComplete);
    const getDragStateRef = useRef(getDragState);
    const hideUiRef = useRef(hideUi);
    const healingTutorialTowerCreatureIdRef = useRef(
      healingTutorialTowerCreatureId
    );
    const dragPosRef = useRef<{ x: number; y: number } | null>(null);
    const dragPointerRef = useRef<
      | (TDDragPointer & {
          type: 'tower' | 'capture';
          source: 'external' | 'internal';
          pointerId?: number;
        })
      | null
    >(null);
    const viewportSizeRef = useRef({ width: 0, height: 0 });
    const edgeScrollStateRef = useRef(createTDDragEdgeScrollState());
    const draggingCaptureDeviceRef = useRef<boolean>(false);
    const externalDraggingTowerIdRef = useRef<string | null>(null);
    const bgBoundsRef = useRef<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>({ x: 0, y: 0, width: 0, height: 0 });
    const scrollRef = useRef({ x: 0, y: 0 });
    const isScrollDraggingRef = useRef(false);
    const isOpeningPanActiveRef = useRef(!!openingPan);
    const scrollDragStartRef = useRef<{
      x: number;
      y: number;
      scrollX: number;
      scrollY: number;
    } | null>(null);
    const zoomRef = useRef(
      resolveTDInitialView(backgroundScale, initialView).zoom
    ); // Same value changed by the in-game +/- controls.

    useImperativeHandle(ref, () => ({
      handleExternalMove: (
        clientX,
        clientY,
        type,
        towerCreatureId,
        pointerType = 'mouse'
      ) => {
        if (isOpeningPanActiveRef.current) return;
        const pointer = {
          clientX,
          clientY,
          pointerType,
          type,
          source: 'external' as const,
        };
        dragPointerRef.current = pointer;
        draggingCaptureDeviceRef.current = type === 'capture';
        externalDraggingTowerIdRef.current =
          type === 'tower' ? (towerCreatureId ?? null) : null;
        const bgBounds = bgBoundsRef.current;
        if (bgBounds && bgBounds.width > 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          dragPosRef.current =
            resolveTDDragPointer(
              pointer,
              rect,
              viewportSizeRef.current,
              bgBounds
            )?.world ?? null;
        }
      },
      handleExternalLeave: () => {
        edgeScrollStateRef.current = createTDDragEdgeScrollState();
        if (dragPointerRef.current?.source === 'external')
          dragPointerRef.current = null;
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;
        externalDraggingTowerIdRef.current = null;
      },
      handleExternalDrop: (
        clientX,
        clientY,
        towerIdStr,
        isCaptureDevice,
        pointerType = 'mouse'
      ) => {
        edgeScrollStateRef.current = createTDDragEdgeScrollState();
        if (isOpeningPanActiveRef.current) return;
        dragPointerRef.current = null;
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;
        externalDraggingTowerIdRef.current = null;

        const bgBounds = bgBoundsRef.current;
        if (!bgBounds || bgBounds.width === 0 || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const point = resolveTDDragPointer(
          { clientX, clientY, pointerType },
          rect,
          viewportSizeRef.current,
          bgBounds
        )?.world;
        if (!point) {
          if (towerIdStr) onMapRemoveRef.current(towerIdStr);
          return;
        }
        const { x, y } = point;

        if (isCaptureDevice && engine) {
          let targetedEnemyId: string | null = null;
          let isWeakened = false;
          let minSqDist = Infinity;
          const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

          engine.enemies.forEach((enemy) => {
            const dx = x - enemy.position.x;
            const dy = y - enemy.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
              minSqDist = distSq;
              targetedEnemyId = enemy.id;
              isWeakened = isUnitWeakened(enemy);
            }
          });

          if (targetedEnemyId && isWeakened) {
            if (onEnemyCapturedRef.current) {
              onEnemyCapturedRef.current(targetedEnemyId);
            }
          }
          return;
        }

        if (towerIdStr) {
          if (engine) {
            const closestSpot = engine.getTowerDropSpot({ x, y });

            if (closestSpot) {
              onMapDropRef.current(towerIdStr, closestSpot.x, closestSpot.y);
            } else {
              if (onMapRemoveRef.current) {
                onMapRemoveRef.current(towerIdStr);
              }
            }
          }
        }
      },
    }));

    // Keep the latest callback without triggering re-runs of the PIXI initializer
    useEffect(() => {
      onMapDropRef.current = onMapDrop;
    }, [onMapDrop]);

    useEffect(() => {
      getDragStateRef.current = getDragState;
    }, [getDragState]);

    useEffect(() => {
      hideUiRef.current = hideUi;
    }, [hideUi]);

    useEffect(() => {
      healingTutorialTowerCreatureIdRef.current =
        healingTutorialTowerCreatureId;
    }, [healingTutorialTowerCreatureId]);

    useEffect(() => {
      onMapRemoveRef.current = onMapRemove;
    }, [onMapRemove]);

    useEffect(() => {
      onDragStateChangeRef.current = onDragStateChange;
    }, [onDragStateChange]);

    useEffect(() => {
      onEnemyCapturedRef.current = onEnemyCaptured;
    }, [onEnemyCaptured]);

    useEffect(() => {
      onStructureFocusedRef.current = onStructureFocused;
    }, [onStructureFocused]);

    useEffect(() => {
      onOpeningPanCompleteRef.current = onOpeningPanComplete;
    }, [onOpeningPanComplete]);

    useEffect(() => {
      if (!containerRef.current) return;

      isOpeningPanActiveRef.current = !!openingPan;
      const app = new PIXI.Application();

      let isDestroyed = false;
      let isInitialized = false;
      let removePointerListeners: (() => void) | undefined;
      let bgBounds = { x: 0, y: 0, width: 0, height: 0 };

      const initPixi = async () => {
        await app.init({
          resizeTo: containerRef.current!,
          backgroundAlpha: 0,
          preference: 'webgl',
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        isInitialized = true;
        if (isDestroyed) {
          app.destroy(true, { children: true });
          return;
        }

        containerRef.current!.appendChild(app.canvas);

        // Keep broad render concerns in stable layers. Objects within each layer
        // still use their existing insertion order for now; depth sorting is a
        // separate concern that can be added without reshuffling the stage.
        const backgroundLayer = new PIXI.Container();
        backgroundLayer.label = 'backgroundLayer';
        const groundFxLayer = new PIXI.Container();
        groundFxLayer.label = 'groundFxLayer';
        const worldLayer = new PIXI.Container();
        worldLayer.label = 'worldLayer';
        worldLayer.sortableChildren = true;
        const airFxLayer = new PIXI.Container();
        airFxLayer.label = 'airFxLayer';
        const hudLayer = new PIXI.Container();
        hudLayer.label = 'hudLayer';
        app.stage.addChild(
          backgroundLayer,
          groundFxLayer,
          worldLayer,
          airFxLayer,
          hudLayer
        );

        // Add background
        const bgUrl = backgroundUrl || '/battles/bg/bg_dock_battle_td.webp';
        const scale = backgroundScale > 1 ? backgroundScale : 1;
        const resolvedInitialView = resolveTDInitialView(scale, initialView);
        zoomRef.current = resolvedInitialView.zoom;
        await PIXI.Assets.load(bgUrl);
        if (isDestroyed) return;

        const flyingColorsVisual =
          ATTACK_DEFS[AttackId.FLYING_COLORS].projectileVisual;
        if (flyingColorsVisual?.type === 'FLYING_COLORS') {
          void PIXI.Assets.load(flyingColorsVisual.spriteUrl);
        }
        const riggingNestVisual =
          ATTACK_DEFS[AttackId.RIGGING_NEST].riggingNest;
        if (riggingNestVisual) {
          for (const url of new Set([
            riggingNestVisual.nestSpriteUrl,
            ...Object.values(riggingNestVisual.threadlingSpriteUrls),
          ])) {
            void PIXI.Assets.load(url);
          }
        }

        const bgSprite = PIXI.Sprite.from(bgUrl);
        backgroundLayer.addChild(bgSprite);
        const mosaicCurrentGraphics = new PIXI.Graphics();
        mosaicCurrentGraphics.eventMode = 'none';
        bgSprite.addChild(mosaicCurrentGraphics);
        const acidVolleyGraphics = new PIXI.Graphics();
        acidVolleyGraphics.eventMode = 'none';
        airFxLayer.addChild(acidVolleyGraphics);
        const enemyGroundOrbGraphics = new PIXI.Graphics();
        enemyGroundOrbGraphics.eventMode = 'none';
        airFxLayer.addChild(enemyGroundOrbGraphics);
        const captureHaulRopeGraphics = new PIXI.Graphics();
        captureHaulRopeGraphics.eventMode = 'none';
        airFxLayer.addChild(captureHaulRopeGraphics);

        // Full (unscrolled) background dimensions — used to derive scroll limits
        let fullBgHeight = 0;
        let fullBgWidth = 0;
        let displayBgHeight = 0;
        let displayBgWidth = 0;
        let shouldApplyInitialView = true;
        let openingPanStartTime: number | null = null;
        let openingPanCompleted = !openingPan;

        // Handle resize + zoom — called each tick to pick up zoom changes
        const updateBgLayout = () => {
          viewportSizeRef.current = {
            width: app.screen.width,
            height: app.screen.height,
          };
          if (
            bgSprite.texture.width > 0 &&
            bgSprite.texture.height > 0 &&
            app.screen.height > 0
          ) {
            const ratio = bgSprite.texture.width / bgSprite.texture.height;
            const zoom = zoomRef.current;
            fullBgHeight = resolveTDBattlefieldHeight(
              app.screen.width,
              app.screen.height,
              ratio,
              scale,
              fitToScreen
            );
            fullBgWidth = fullBgHeight * ratio;

            // Display dimensions = world dims * zoom
            const displayH = fullBgHeight * zoom;
            const displayW = fullBgWidth * zoom;
            displayBgHeight = displayH;
            displayBgWidth = displayW;
            bgSprite.height = displayH;
            bgSprite.width = displayW;

            // Clamp scroll (in pixel space)
            const maxScrollY = Math.max(0, displayH - app.screen.height);
            const maxScrollX = Math.max(0, displayW - app.screen.width);
            if (shouldApplyInitialView) {
              openingPanStartTime = openingPan ? performance.now() : null;
              const openingView = openingPan
                ? resolveTDOpeningPanView(resolvedInitialView, openingPan, 0)
                : resolvedInitialView;
              scrollRef.current = {
                x: maxScrollX * (openingView.offsetX / 100),
                y: maxScrollY * (openingView.offsetY / 100),
              };
              shouldApplyInitialView = false;
            } else if (
              openingPan &&
              openingPanStartTime !== null &&
              !openingPanCompleted
            ) {
              const progress = Math.min(
                1,
                (performance.now() - openingPanStartTime) /
                  Math.max(1, openingPan.durationMs)
              );
              const openingView = resolveTDOpeningPanView(
                resolvedInitialView,
                openingPan,
                progress
              );
              scrollRef.current = {
                x: maxScrollX * (openingView.offsetX / 100),
                y: maxScrollY * (openingView.offsetY / 100),
              };

              if (progress === 1) {
                openingPanCompleted = true;
                isOpeningPanActiveRef.current = false;
                onOpeningPanCompleteRef.current?.();
              }
            } else {
              scrollRef.current.y = Math.min(scrollRef.current.y, maxScrollY);
              scrollRef.current.x = Math.min(scrollRef.current.x, maxScrollX);
            }

            const centeredX = Math.max(0, (app.screen.width - displayW) / 2);
            const centeredY = Math.max(0, (app.screen.height - displayH) / 2);
            bgSprite.x = centeredX - scrollRef.current.x;
            bgSprite.y = centeredY - scrollRef.current.y;

            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: displayW,
              height: displayH,
            };
            bgBoundsRef.current = bgBounds;
            if (engine) {
              engine.setAspectRatio(ratio);
            }
          }
        };
        app.renderer.on('resize', updateBgLayout);
        updateBgLayout(); // Initial setting

        // Interactive background
        bgSprite.eventMode = 'static';

        // --- Scroll drag on background ---
        if (scale > 1) {
          bgSprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            if (bgBounds.width > 0 && bgBounds.height > 0) {
              const worldX = ((e.global.x - bgBounds.x) / bgBounds.width) * 100;
              const worldY =
                ((e.global.y - bgBounds.y) / bgBounds.height) * 100;
              const clickedStructure = engine.enemies.find(
                (enemy) =>
                  enemy.kind === 'structure' &&
                  enemy.hp > 0 &&
                  Math.abs(enemy.position.x - worldX) <= 5 &&
                  Math.abs(enemy.position.y - worldY) <= 8
              );
              if (clickedStructure) {
                onStructureFocusedRef.current?.(clickedStructure.id);
                return;
              }
            }

            // Only start scroll if not dragging a tower or capture device
            if (
              isOpeningPanActiveRef.current ||
              draggingTowerCreatureId ||
              getDragStateRef.current?.()
            )
              return;
            isScrollDraggingRef.current = true;
            scrollDragStartRef.current = {
              x: e.global.x,
              y: e.global.y,
              scrollX: scrollRef.current.x,
              scrollY: scrollRef.current.y,
            };
          });
        }

        // Sprite caching structure
        const towerSprites = new Map<string, PIXI.Container>();
        const enemySprites = new Map<string, PIXI.Container>();
        const flagRunnerSprites = new Map<string, PIXI.Container>();
        const flagShotGraphics = new PIXI.Graphics();
        flagShotGraphics.eventMode = 'none';
        airFxLayer.addChild(flagShotGraphics);
        const environmentUnitSprites = new Map<string, PIXI.Container>();
        const objectiveAllySprites = new Map<string, PIXI.Container>();
        const objectiveAllyShadowSprites = new Map<string, PIXI.Container>();
        const riggingNestSprites = new Map<string, PIXI.Container>();
        const riggingThreadlingSprites = new Map<string, PIXI.Container>();
        const destroyedStructureSprites = new Map<string, PIXI.Container>();
        const captureUnitSprites = new Map<string, PIXI.Container>();
        const projectileSprites = new Map<string, PIXI.Container>();
        const flyingColorsTrails = new Map<
          string,
          {
            graphics: PIXI.Graphics;
            points: FlyingColorsTrailPoint[];
            color: number;
          }
        >();
        const vfxSprites = new Map<string, PIXI.Container>();
        const floatingTextSprites = new Map<string, PIXI.Text>();
        const recoveryFeedSprites = new Map<string, PIXI.Container>();
        const offscreenEnemyIndicatorSprites = new Map<
          string,
          PIXI.Container
        >();
        const spotGraphics = new PIXI.Graphics();
        const launchGraphics = new PIXI.Graphics();
        launchGraphics.eventMode = 'none';
        groundFxLayer.addChild(launchGraphics);
        const launchLabel = new PIXI.Text({
          text: 'Run to flag',
          style: {
            fontFamily: 'Arial',
            fontSize: 18,
            fontWeight: 'bold',
            fill: 0xe0f2fe,
            stroke: { color: 0x082f49, width: 4 },
          },
        });
        launchLabel.anchor.set(0.5, 0);
        launchLabel.eventMode = 'none';
        hudLayer.addChild(launchLabel);
        const invalidSpotGraphics = new PIXI.Graphics();
        const recoveryTutorialGraphics = new PIXI.Graphics();
        const resonantEvolutionGraphics = new PIXI.Graphics();

        let draggingNode: PIXI.Container | null = null;
        let draggingTowerCreatureId: string | null = null;

        app.stage.eventMode = 'static';
        app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

        const resolveDrag = () => {
          const pointer = dragPointerRef.current;
          const rect = containerRef.current?.getBoundingClientRect();
          return pointer && rect
            ? resolveTDDragPointer(
                pointer,
                rect,
                viewportSizeRef.current,
                bgBounds
              )
            : null;
        };
        const updateDraggedPosition = () => {
          const position = resolveDrag();
          dragPosRef.current = position?.world ?? null;
          if (draggingNode && position) {
            draggingNode.position.set(position.aim.x, position.aim.y);
          }
        };
        const finishInternalDrag = (drop: boolean) => {
          if (!draggingTowerCreatureId) return;
          const pointerId = dragPointerRef.current?.pointerId;
          if (drop) {
            const point = resolveDrag()?.world;
            const closestSpot = point ? engine.getTowerDropSpot(point) : null;
            if (closestSpot) {
              onMapDropRef.current(
                draggingTowerCreatureId,
                closestSpot.x,
                closestSpot.y
              );
            } else {
              onMapRemoveRef.current(draggingTowerCreatureId);
            }
          }
          dragPosRef.current = null;
          dragPointerRef.current = null;
          edgeScrollStateRef.current = createTDDragEdgeScrollState();
          if (draggingNode) draggingNode.cursor = 'grab';
          draggingNode = null;
          draggingTowerCreatureId = null;
          onDragStateChangeRef.current?.(false);
          if (
            pointerId !== undefined &&
            app.canvas.hasPointerCapture(pointerId)
          )
            app.canvas.releasePointerCapture(pointerId);
        };
        const onPointerMove = (event: PointerEvent) => {
          const pointer = dragPointerRef.current;
          if (
            pointer?.source !== 'internal' ||
            event.pointerId !== pointer.pointerId
          )
            return;
          pointer.clientX = event.clientX;
          pointer.clientY = event.clientY;
          updateDraggedPosition();
        };
        const onPointerUp = (event: PointerEvent) => {
          if (
            dragPointerRef.current?.source === 'internal' &&
            event.pointerId === dragPointerRef.current.pointerId
          ) {
            onPointerMove(event);
            finishInternalDrag(true);
          }
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        };
        const cancelDrag = () => {
          finishInternalDrag(false);
          dragPointerRef.current = null;
          dragPosRef.current = null;
          edgeScrollStateRef.current = createTDDragEdgeScrollState();
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        };
        const onPointerCancel = (event: PointerEvent) => {
          const pointer = dragPointerRef.current;
          if (
            pointer?.source !== 'internal' ||
            pointer.pointerId !== event.pointerId
          )
            return;
          cancelDrag();
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
        window.addEventListener('blur', cancelDrag);
        app.canvas.addEventListener('lostpointercapture', onPointerCancel);
        removePointerListeners = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerCancel);
          window.removeEventListener('blur', cancelDrag);
          app.canvas.removeEventListener('lostpointercapture', onPointerCancel);
        };
        app.stage.on('pointermove', (e) => {
          // Handle scroll dragging
          if (
            isScrollDraggingRef.current &&
            scrollDragStartRef.current &&
            scale > 1
          ) {
            const dx = scrollDragStartRef.current.x - e.global.x;
            const dy = scrollDragStartRef.current.y - e.global.y;
            const maxScrollY = Math.max(0, displayBgHeight - app.screen.height);
            const maxScrollX = Math.max(0, displayBgWidth - app.screen.width);
            scrollRef.current.y = Math.max(
              0,
              Math.min(maxScrollY, scrollDragStartRef.current.scrollY + dy)
            );
            scrollRef.current.x = Math.max(
              0,
              Math.min(maxScrollX, scrollDragStartRef.current.scrollX + dx)
            );
            const centeredX = Math.max(
              0,
              (app.screen.width - displayBgWidth) / 2
            );
            const centeredY = Math.max(
              0,
              (app.screen.height - displayBgHeight) / 2
            );
            bgSprite.x = centeredX - scrollRef.current.x;
            bgSprite.y = centeredY - scrollRef.current.y;
            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: bgSprite.width,
              height: bgSprite.height,
            };
            bgBoundsRef.current = bgBounds;
          }
        });

        // Stop scroll dragging on pointer up
        app.stage.on('pointerup', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });
        app.stage.on('pointerupoutside', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });

        // PIXI's internal ticker, synced to monitor refresh rate.
        // This DOES NOT run game logic, it ONLY draws current state.
        app.ticker.add((ticker) => {
          // Re-evaluate bg layout each tick to pick up zoom changes
          updateBgLayout();
          const pointer = dragPointerRef.current;
          const rect = pointer
            ? containerRef.current?.getBoundingClientRect()
            : null;
          const edgeScroll = advanceTDDragEdgeScroll({
            aim:
              !isOpeningPanActiveRef.current && pointer && rect
                ? resolveTDDragScrollAim(
                    pointer,
                    rect,
                    viewportSizeRef.current,
                    dragSurfaceRef?.current?.getBoundingClientRect() ?? rect
                  )
                : null,
            viewport: viewportSizeRef.current,
            scroll: scrollRef.current,
            maxScroll: {
              x: Math.max(0, displayBgWidth - app.screen.width),
              y: Math.max(0, displayBgHeight - app.screen.height),
            },
            deltaMs: ticker.deltaMS,
            state: edgeScrollStateRef.current,
          });
          edgeScrollStateRef.current = edgeScroll.state;
          if (
            edgeScroll.scroll.x !== scrollRef.current.x ||
            edgeScroll.scroll.y !== scrollRef.current.y
          ) {
            scrollRef.current = edgeScroll.scroll;
            updateBgLayout();
          }
          if (dragPointerRef.current) updateDraggedPosition();

          if (fpsRef.current) {
            fpsRef.current.innerText = `FPS: ${Math.round(app.ticker.FPS)}`;
          }

          if (!engine || bgBounds.width === 0) return;

          const zoom = zoomRef.current;
          const screenW = bgBounds.width;
          const screenH = bgBounds.height;
          const offsetX = bgBounds.x;
          const offsetY = bgBounds.y;
          const viewportH = app.screen.height; // For sizing UI elements (not affected by bg scale)

          // Parlet's mosaic currents are painted onto the battlefield itself,
          // keeping them beneath creatures, towers, labels, and projectiles.
          mosaicCurrentGraphics.clear();
          const textureWidth = bgSprite.texture.width;
          const textureHeight = bgSprite.texture.height;
          const currentColors = [0x22d3ee, 0xf472b6, 0xfacc15, 0xa78bfa];
          for (const current of engine.objectiveAllyCurrents) {
            if (current.visualPath.length < 2) continue;
            const visualWidth =
              ((current.width * 2) / Math.max(1, backgroundScale) / 100) *
              textureHeight;
            const pathPoints = current.visualPath.map((point) => ({
              x: (point.x / 100) * textureWidth,
              y: (point.y / 100) * textureHeight,
            }));

            mosaicCurrentGraphics.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (const point of pathPoints.slice(1)) {
              mosaicCurrentGraphics.lineTo(point.x, point.y);
            }
            mosaicCurrentGraphics.stroke({
              color: 0x155e75,
              width: visualWidth,
              alpha: 0.22,
            });
            mosaicCurrentGraphics.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (const point of pathPoints.slice(1)) {
              mosaicCurrentGraphics.lineTo(point.x, point.y);
            }
            mosaicCurrentGraphics.stroke({
              color: 0x67e8f9,
              width: visualWidth * 0.52,
              alpha: 0.13,
            });

            const tileCount = 13;
            const tileSize = Math.max(4, visualWidth * 0.13);
            for (const row of [-1, 0, 1]) {
              for (let index = 0; index < tileCount; index++) {
                const tileProgress =
                  (index / tileCount +
                    engine.elapsedTimeMs / 6500 +
                    row * 0.018) %
                  1;
                const point = getVisualPathPoint(
                  current.visualPath,
                  tileProgress,
                  textureWidth,
                  textureHeight
                );
                const perpendicularX = -Math.sin(point.angle);
                const perpendicularY = Math.cos(point.angle);
                const rowOffset = row * visualWidth * 0.24;
                const x = point.x + perpendicularX * rowOffset;
                const y = point.y + perpendicularY * rowOffset;
                const size = tileSize * (0.85 + ((index + row + 1) % 3) * 0.1);
                mosaicCurrentGraphics.poly([
                  x,
                  y - size,
                  x + size,
                  y,
                  x,
                  y + size,
                  x - size,
                  y,
                ]);
                mosaicCurrentGraphics.fill({
                  color:
                    currentColors[(index + row + 1) % currentColors.length],
                  alpha: row === 0 ? 0.72 : 0.58,
                });
              }
            }

            const surgeAge =
              current.lastSurgeAtMs === undefined
                ? Infinity
                : engine.elapsedTimeMs - current.lastSurgeAtMs;
            if (surgeAge >= 0 && surgeAge < current.surgeVisualDurationMs) {
              const surgeProgress = surgeAge / current.surgeVisualDurationMs;
              const point = getVisualPathPoint(
                current.visualPath,
                surgeProgress,
                textureWidth,
                textureHeight
              );
              const pulseSize = visualWidth * (0.28 + surgeProgress * 0.14);
              mosaicCurrentGraphics.circle(point.x, point.y, pulseSize);
              mosaicCurrentGraphics.fill({
                color: currentColors[current.pathIndex % currentColors.length],
                alpha: 0.3 * (1 - surgeProgress),
              });
              mosaicCurrentGraphics.circle(point.x, point.y, pulseSize * 0.7);
              mosaicCurrentGraphics.stroke({
                color: 0xecfeff,
                width: Math.max(2, visualWidth * 0.08),
                alpha: 0.9 * (1 - surgeProgress),
              });
            }
          }

          acidVolleyGraphics.clear();
          for (const shot of engine.objectiveAllyAcidShots) {
            if (engine.elapsedTimeMs < shot.launchedAtMs) continue;
            const sourceX = offsetX + (shot.sourcePosition.x / 100) * screenW;
            const sourceY = offsetY + (shot.sourcePosition.y / 100) * screenH;
            const targetX = offsetX + (shot.targetPosition.x / 100) * screenW;
            const targetY = offsetY + (shot.targetPosition.y / 100) * screenH;
            const flightDuration = Math.max(
              1,
              shot.impactAtMs - shot.launchedAtMs
            );
            const progress = Math.max(
              0,
              Math.min(
                1,
                (engine.elapsedTimeMs - shot.launchedAtMs) / flightDuration
              )
            );
            if (shot.impactedAtMs === undefined) {
              const x = sourceX + (targetX - sourceX) * progress;
              const y =
                sourceY +
                (targetY - sourceY) * progress -
                Math.sin(progress * Math.PI) *
                  Math.min(90, 35 + Math.abs(targetX - sourceX) * 0.08);
              const previousProgress = Math.max(0, progress - 0.08);
              const previousX =
                sourceX + (targetX - sourceX) * previousProgress;
              const previousY =
                sourceY +
                (targetY - sourceY) * previousProgress -
                Math.sin(previousProgress * Math.PI) *
                  Math.min(90, 35 + Math.abs(targetX - sourceX) * 0.08);
              acidVolleyGraphics.moveTo(previousX, previousY);
              acidVolleyGraphics.lineTo(x, y);
              acidVolleyGraphics.stroke({
                color: 0xd946ef,
                width: 7,
                alpha: 0.42,
              });
              acidVolleyGraphics.circle(x, y, 7);
              acidVolleyGraphics.fill({ color: 0xa3e635, alpha: 0.92 });
              acidVolleyGraphics.circle(x - 2, y - 2, 3);
              acidVolleyGraphics.fill({ color: 0xf0abfc, alpha: 0.85 });
            } else {
              const impactAge = engine.elapsedTimeMs - shot.impactedAtMs;
              const impactProgress = Math.min(1, impactAge / 360);
              acidVolleyGraphics.circle(
                targetX,
                targetY,
                10 + impactProgress * 28
              );
              acidVolleyGraphics.stroke({
                color: 0xa3e635,
                width: 5 * (1 - impactProgress) + 1,
                alpha: 0.85 * (1 - impactProgress),
              });
              for (let index = 0; index < 5; index++) {
                const angle = (index / 5) * Math.PI * 2;
                const distance = 8 + impactProgress * 24;
                acidVolleyGraphics.circle(
                  targetX + Math.cos(angle) * distance,
                  targetY + Math.sin(angle) * distance,
                  3
                );
                acidVolleyGraphics.fill({
                  color: index % 2 === 0 ? 0xd946ef : 0xa3e635,
                  alpha: 0.75 * (1 - impactProgress),
                });
              }
            }
          }
          airFxLayer.setChildIndex(
            acidVolleyGraphics,
            airFxLayer.children.length - 1
          );

          enemyGroundOrbGraphics.clear();
          for (const orb of engine.enemyGroundOrbs) {
            const sourceX = offsetX + (orb.sourcePosition.x / 100) * screenW;
            const sourceY = offsetY + (orb.sourcePosition.y / 100) * screenH;
            const targetX = offsetX + (orb.targetPosition.x / 100) * screenW;
            const targetY = offsetY + (orb.targetPosition.y / 100) * screenH;
            const warningRadius = Math.max(
              20,
              (orb.impactRadius / 100) * screenH
            );

            if (orb.impactedAtMs === undefined) {
              const flightDuration = Math.max(
                1,
                orb.impactAtMs - orb.launchedAtMs
              );
              const progress = Math.max(
                0,
                Math.min(
                  1,
                  (engine.elapsedTimeMs - orb.launchedAtMs) / flightDuration
                )
              );
              const pulse = 0.5 + Math.sin(engine.elapsedTimeMs / 90) * 0.5;
              enemyGroundOrbGraphics.circle(
                targetX,
                targetY,
                warningRadius * (0.92 + pulse * 0.08)
              );
              enemyGroundOrbGraphics.fill({
                color: 0xfacc15,
                alpha: 0.08 + pulse * 0.05,
              });
              enemyGroundOrbGraphics.circle(
                targetX,
                targetY,
                warningRadius * (0.92 + pulse * 0.08)
              );
              enemyGroundOrbGraphics.stroke({
                color: 0xfde047,
                width: 3,
                alpha: 0.72 + pulse * 0.2,
              });

              const x = sourceX + (targetX - sourceX) * progress;
              const y =
                sourceY +
                (targetY - sourceY) * progress -
                Math.sin(progress * Math.PI) * 38;
              const previousProgress = Math.max(0, progress - 0.06);
              const previousX =
                sourceX + (targetX - sourceX) * previousProgress;
              const previousY =
                sourceY +
                (targetY - sourceY) * previousProgress -
                Math.sin(previousProgress * Math.PI) * 38;
              enemyGroundOrbGraphics.moveTo(previousX, previousY);
              enemyGroundOrbGraphics.lineTo(x, y);
              enemyGroundOrbGraphics.stroke({
                color: 0x60a5fa,
                width: 8,
                alpha: 0.32,
              });
              enemyGroundOrbGraphics.circle(x, y, 13 + pulse * 2);
              enemyGroundOrbGraphics.fill({ color: 0x2563eb, alpha: 0.38 });
              enemyGroundOrbGraphics.circle(x, y, 8 + pulse);
              enemyGroundOrbGraphics.fill({ color: 0x60a5fa, alpha: 0.95 });
              enemyGroundOrbGraphics.circle(x - 2, y - 2, 3.5);
              enemyGroundOrbGraphics.fill({ color: 0xfef9c3, alpha: 0.95 });
            } else {
              const impactProgress = Math.min(
                1,
                (engine.elapsedTimeMs - orb.impactedAtMs) / 450
              );
              enemyGroundOrbGraphics.circle(
                targetX,
                targetY,
                warningRadius * (0.7 + impactProgress * 1.4)
              );
              enemyGroundOrbGraphics.stroke({
                color: 0x60a5fa,
                width: 7 * (1 - impactProgress) + 1,
                alpha: 0.95 * (1 - impactProgress),
              });
              for (let index = 0; index < 8; index++) {
                const angle = (index / 8) * Math.PI * 2;
                const innerDistance = warningRadius * 0.4;
                const outerDistance =
                  warningRadius * (0.8 + impactProgress * 1.3);
                enemyGroundOrbGraphics.moveTo(
                  targetX + Math.cos(angle) * innerDistance,
                  targetY + Math.sin(angle) * innerDistance
                );
                enemyGroundOrbGraphics.lineTo(
                  targetX + Math.cos(angle) * outerDistance,
                  targetY + Math.sin(angle) * outerDistance
                );
                enemyGroundOrbGraphics.stroke({
                  color: index % 2 === 0 ? 0xfde047 : 0x60a5fa,
                  width: 4 * (1 - impactProgress) + 1,
                  alpha: 0.85 * (1 - impactProgress),
                });
              }
            }
          }
          airFxLayer.setChildIndex(
            enemyGroundOrbGraphics,
            airFxLayer.children.length - 1
          );

          const externalDragState = getDragStateRef.current
            ? getDragStateRef.current()
            : false;
          const isDraggingCapture =
            draggingCaptureDeviceRef.current || externalDragState === 'capture';
          const isDraggingTower =
            externalDragState === 'tower' ||
            (!isDraggingCapture && dragPosRef.current !== null) ||
            draggingTowerCreatureId !== null;

          // The launch destination stays visible even before a roster drag starts.
          const launch = engine.flagDuel?.playerLaunch?.position;
          const hoveredSpot = dragPosRef.current
            ? engine.getTowerDropSpot(dragPosRef.current)
            : undefined;
          const hoveringLaunch =
            !!launch && isDraggingTower && hoveredSpot === launch;
          launchGraphics.clear();
          launchLabel.visible = !!launch && !hideUiRef.current;
          if (launch && !hideUiRef.current) {
            const x = offsetX + (launch.x / 100) * screenW;
            const y = offsetY + (launch.y / 100) * screenH;
            const radius = viewportH * 0.05 * zoom;
            launchGraphics
              .circle(x, y, radius)
              .fill({ color: 0x0ea5e9, alpha: hoveringLaunch ? 0.5 : 0.25 })
              .stroke({ color: 0x67e8f9, width: hoveringLaunch ? 4 : 2 });
            launchGraphics
              .moveTo(x - radius * 0.45, y)
              .lineTo(x + radius * 0.45, y)
              .lineTo(x + radius * 0.1, y - radius * 0.3)
              .moveTo(x + radius * 0.45, y)
              .lineTo(x + radius * 0.1, y + radius * 0.3)
              .stroke({ color: 0xe0f2fe, width: 3 });
            launchLabel.position.set(x, y + radius + 3);
            launchLabel.scale.set(
              Math.max(0.6, (zoom * app.screen.height) / TD_BASE_HEIGHT)
            );
            if (hoveringLaunch) {
              const path =
                engine.paths[engine.flagDuel!.alliedRunner.pathIndex];
              path?.forEach((point, index) => {
                const px = offsetX + (point.x / 100) * screenW;
                const py = offsetY + (point.y / 100) * screenH;
                if (index === 0) launchGraphics.moveTo(px, py);
                else launchGraphics.lineTo(px, py);
              });
              launchGraphics.stroke({ color: 0x67e8f9, width: 3, alpha: 0.7 });
            }
          }

          // --- Render Environment Units ---
          const currentEnvUnitIds = new Set(
            engine.environmentUnits.map((e) => e.id)
          );
          for (const [id, sprite] of environmentUnitSprites.entries()) {
            if (!currentEnvUnitIds.has(id)) {
              worldLayer.removeChild(sprite);
              sprite.destroy({ children: true });
              environmentUnitSprites.delete(id);
            }
          }

          for (const envUnit of engine.environmentUnits) {
            const isTowerRecoveryHealer =
              engine.towerRecovery !== undefined &&
              Math.abs(
                envUnit.position.x - engine.towerRecovery.healerPosition.x
              ) < 0.001 &&
              Math.abs(
                envUnit.position.y - engine.towerRecovery.healerPosition.y
              ) < 0.001;
            const environmentVisualState =
              envUnit.visualState ??
              (isTowerRecoveryHealer && !engine.towerRecoveryTargetTowerId
                ? 'idle'
                : undefined);
            let container = environmentUnitSprites.get(envUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'env_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              worldLayer.addChild(container);

              environmentUnitSprites.set(envUnit.id, container);
            }

            container.x = offsetX + (envUnit.position.x / 100) * screenW;
            container.y = offsetY + (envUnit.position.y / 100) * screenH;

            // Calculate responsive scale based on the editor's 80x80 box matching 5vh placement spots
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;

            container.scale.set(finalScale);

            const sprite = container.getChildByLabel('env_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (sprite && shadow) {
              applyTDUnitTransforms(
                envUnit,
                sprite,
                shadow,
                envUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                },
                environmentVisualState
              );
            }
            renderHealthBar(
              envUnit,
              container,
              envUnit.tdConfigId,
              true /* hideWhenFull */
            );
            updateContainerWorldDepth(
              container,
              getTDUnitGroundContactOffset(
                envUnit,
                envUnit.tdConfigId,
                environmentVisualState
              )
            );
          }

          // --- Render allied flag runners (automatic waves and roster deployments) ---
          const flagRunnerIds = new Set(
            engine.alliedFlagRunners.map((runner) => runner.id)
          );
          for (const [id, container] of flagRunnerSprites) {
            if (!flagRunnerIds.has(id)) {
              container.destroy({ children: true });
              flagRunnerSprites.delete(id);
            }
          }
          for (const runner of engine.alliedFlagRunners) {
            let container = flagRunnerSprites.get(runner.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';
              const marker = new PIXI.Graphics();
              marker.label = 'flagRunnerMarker';
              container.addChild(marker);
              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);
              const sprite = new PIXI.Sprite();
              sprite.label = 'flagRunnerSprite';
              sprite.anchor.set(0.5);
              container.addChild(sprite);
              worldLayer.addChild(container);
              flagRunnerSprites.set(runner.id, container);
            }
            container.position.set(
              offsetX + (runner.position.x / 100) * screenW,
              offsetY + (runner.position.y / 100) * screenH
            );
            container.scale.set((zoom * app.screen.height) / TD_BASE_HEIGHT);
            const marker = container.getChildByLabel(
              'flagRunnerMarker'
            ) as PIXI.Graphics;
            const ground = getTDUnitGroundContactOffset(
              runner,
              runner.definitionId
            );
            marker
              .clear()
              .ellipse(ground.x, ground.y, 28, 10)
              .fill({ color: 0x38bdf8, alpha: 0.65 })
              .stroke({ color: 0xa5f3fc, width: 2 });
            if (runner.strikeEndsAtMs !== undefined) {
              marker.circle(0, 0, 30).stroke({ color: 0x67e8f9, width: 3 });
            }
            const sprite = container.getChildByLabel(
              'flagRunnerSprite'
            ) as PIXI.Sprite;
            const shadow = container.getChildByLabel('shadow') as PIXI.Graphics;
            applyTDUnitTransforms(
              runner,
              sprite,
              shadow,
              runner.definitionId,
              TD_CREATURE_DEFS[runner.definitionId]?.baseCreature
                .battleSpriteUrl,
              (texture) => {
                if (!isDestroyed) sprite.texture = texture;
              }
            );
            renderHealthBar(runner, container, runner.definitionId);
            updateContainerWorldDepth(
              container,
              getTDUnitGroundContactOffset(runner, runner.definitionId)
            );
          }
          flagShotGraphics.clear();
          for (const shot of engine.flagDuelShots) {
            flagShotGraphics.moveTo(
              offsetX + (shot.source.x / 100) * screenW,
              offsetY + (shot.source.y / 100) * screenH
            );
            flagShotGraphics.lineTo(
              offsetX + (shot.target.x / 100) * screenW,
              offsetY + (shot.target.y / 100) * screenH
            );
            flagShotGraphics.stroke({ color: 0xfca5a5, width: 3, alpha: 0.8 });
          }

          // --- Render objective allies (captives and released helpers) ---
          const currentObjectiveAllyIds = new Set(
            engine.objectiveAllies.map((ally) => ally.id)
          );
          for (const [id, container] of objectiveAllySprites) {
            if (!currentObjectiveAllyIds.has(id)) {
              worldLayer.removeChild(container);
              container.destroy({ children: true });
              objectiveAllySprites.delete(id);
            }
          }

          for (const ally of engine.objectiveAllies) {
            let container = objectiveAllySprites.get(ally.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';

              const marker = new PIXI.Graphics();
              marker.label = 'objectiveAllyMarker';
              container.addChild(marker);

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'objectiveAllySprite';
              sprite.anchor.set(0.5);
              container.addChild(sprite);

              const action = new PIXI.Graphics();
              action.label = 'objectiveAllyAction';
              container.addChild(action);

              worldLayer.addChild(container);
              objectiveAllySprites.set(ally.id, container);
            }

            container.x = offsetX + (ally.position.x / 100) * screenW;
            container.y = offsetY + (ally.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            container.scale.set(zoom * responsiveScale);

            const sprite = container.getChildByLabel(
              'objectiveAllySprite'
            ) as PIXI.Sprite;
            const shadow = container.getChildByLabel('shadow') as PIXI.Graphics;
            applyTDUnitTransforms(
              ally,
              sprite,
              shadow,
              ally.tdConfigId,
              TD_CREATURE_DEFS[ally.definitionId]?.baseCreature.battleSpriteUrl,
              (texture) => {
                if (!isDestroyed) sprite.texture = texture;
              }
            );
            updateObjectiveAllyVisual(container, ally, engine.elapsedTimeMs);
            updateContainerWorldDepth(
              container,
              getTDUnitGroundContactOffset(ally, ally.tdConfigId)
            );
          }

          // Sepippet's projections are temporary, untargetable allied attackers.
          const currentObjectiveAllyShadowIds = new Set(
            engine.objectiveAllyShadows.map((shadow) => shadow.id)
          );
          for (const [id, container] of objectiveAllyShadowSprites) {
            if (!currentObjectiveAllyShadowIds.has(id)) {
              worldLayer.removeChild(container);
              container.destroy({ children: true });
              objectiveAllyShadowSprites.delete(id);
            }
          }

          for (const projection of engine.objectiveAllyShadows) {
            let container = objectiveAllyShadowSprites.get(projection.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';

              const marker = new PIXI.Graphics();
              marker.label = 'projectionMarker';
              container.addChild(marker);

              const creatureShadow = new PIXI.Graphics();
              creatureShadow.label = 'shadow';
              container.addChild(creatureShadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'projectionSprite';
              sprite.anchor.set(0.5);
              container.addChild(sprite);

              const action = new PIXI.Graphics();
              action.label = 'projectionAction';
              container.addChild(action);

              worldLayer.addChild(container);
              objectiveAllyShadowSprites.set(projection.id, container);
            }

            container.x = offsetX + (projection.position.x / 100) * screenW;
            container.y = offsetY + (projection.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const renderScale = zoom * responsiveScale;
            container.scale.set(renderScale);

            const sprite = container.getChildByLabel(
              'projectionSprite'
            ) as PIXI.Sprite;
            const creatureShadow = container.getChildByLabel(
              'shadow'
            ) as PIXI.Graphics;
            applyTDUnitTransforms(
              projection,
              sprite,
              creatureShadow,
              projection.tdConfigId,
              TD_CREATURE_DEFS[SpeciesId.SEPIPPET]?.baseCreature
                .battleSpriteUrl,
              (texture) => {
                if (!isDestroyed) sprite.texture = texture;
              }
            );
            sprite.tint = 0x5b21b6;
            sprite.alpha = 0.62;
            creatureShadow.alpha = 0.3;

            const marker = container.getChildByLabel(
              'projectionMarker'
            ) as PIXI.Graphics;
            marker.clear();
            marker.ellipse(0, 7, 32, 12);
            marker.fill({ color: 0x4c1d95, alpha: 0.24 });
            marker.stroke({ color: 0xa78bfa, width: 3, alpha: 0.7 });

            const action = container.getChildByLabel(
              'projectionAction'
            ) as PIXI.Graphics;
            action.clear();
            if (
              projection.attackTargetPosition &&
              (projection.attackVisualUntilMs ?? 0) > engine.elapsedTimeMs
            ) {
              const targetX =
                (((projection.attackTargetPosition.x - projection.position.x) /
                  100) *
                  screenW) /
                renderScale;
              const targetY =
                (((projection.attackTargetPosition.y - projection.position.y) /
                  100) *
                  screenH) /
                renderScale;
              action.moveTo(0, -6);
              action.lineTo(targetX, targetY);
              action.stroke({ color: 0xa78bfa, width: 7, alpha: 0.3 });
              action.moveTo(0, -6);
              action.lineTo(targetX, targetY);
              action.stroke({ color: 0xede9fe, width: 2, alpha: 0.85 });
              action.circle(targetX, targetY, 10);
              action.stroke({ color: 0xc4b5fd, width: 3, alpha: 0.8 });
            }
            updateContainerWorldDepth(
              container,
              getTDUnitGroundContactOffset(projection, projection.tdConfigId)
            );
          }

          const riggingVisual = ATTACK_DEFS[AttackId.RIGGING_NEST].riggingNest;
          if (riggingVisual) {
            const currentNestIds = new Set(
              engine.riggingNests.map((nest) => nest.id)
            );
            for (const [id, container] of riggingNestSprites) {
              if (!currentNestIds.has(id)) {
                worldLayer.removeChild(container);
                container.destroy({ children: true });
                riggingNestSprites.delete(id);
              }
            }
            for (const nest of engine.riggingNests) {
              let container = riggingNestSprites.get(nest.id);
              if (!container) {
                container = new PIXI.Container();
                container.eventMode = 'none';
                const shadow = new PIXI.Graphics();
                shadow.label = 'riggingNestShadow';
                container.addChild(shadow);
                const sprite = new PIXI.Sprite() as UrlTrackedSprite;
                sprite.label = 'riggingNestSprite';
                container.addChild(sprite);
                worldLayer.addChild(container);
                riggingNestSprites.set(nest.id, container);
              }

              const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
              const renderScale = zoom * responsiveScale;
              container.position.set(
                offsetX + (nest.position.x / 100) * screenW,
                offsetY + (nest.position.y / 100) * screenH
              );
              container.scale.set(renderScale);
              const shadow = container.getChildByLabel(
                'riggingNestShadow'
              ) as PIXI.Graphics;
              shadow.clear();
              shadow.ellipse(0, 3, 23, 7);
              shadow.fill({ color: 0x000000, alpha: 0.32 });
              const sprite = container.getChildByLabel(
                'riggingNestSprite'
              ) as UrlTrackedSprite;
              updateRasterAttackSprite(
                sprite,
                riggingVisual.nestSpriteUrl,
                58,
                58
              );
              sprite.y = -25;
              const remainingMs = nest.expiresAtMs - engine.elapsedTimeMs;
              container.alpha = Math.max(0, Math.min(1, remainingMs / 240));
              updateContainerWorldDepth(container, { x: 0, y: 3 });
            }

            const currentThreadlingIds = new Set(
              engine.riggingThreadlings.map((threadling) => threadling.id)
            );
            for (const [id, container] of riggingThreadlingSprites) {
              if (!currentThreadlingIds.has(id)) {
                worldLayer.removeChild(container);
                container.destroy({ children: true });
                riggingThreadlingSprites.delete(id);
              }
            }
            for (const threadling of engine.riggingThreadlings) {
              let container = riggingThreadlingSprites.get(threadling.id);
              if (!container) {
                container = new PIXI.Container();
                container.eventMode = 'none';
                const shadow = new PIXI.Graphics();
                shadow.label = 'threadlingShadow';
                container.addChild(shadow);
                const sprite = new PIXI.Sprite() as UrlTrackedSprite;
                sprite.label = 'threadlingSprite';
                container.addChild(sprite);
                worldLayer.addChild(container);
                riggingThreadlingSprites.set(threadling.id, container);
              }

              const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
              const renderScale = zoom * responsiveScale;
              container.position.set(
                offsetX + (threadling.position.x / 100) * screenW,
                offsetY + (threadling.position.y / 100) * screenH
              );
              container.scale.set(renderScale);
              const shadow = container.getChildByLabel(
                'threadlingShadow'
              ) as PIXI.Graphics;
              shadow.clear();
              shadow.ellipse(0, 2, 13, 4);
              shadow.fill({ color: 0x000000, alpha: 0.27 });
              const sprite = container.getChildByLabel(
                'threadlingSprite'
              ) as UrlTrackedSprite;
              const horizontal =
                threadling.facingDirection === 'left' ||
                threadling.facingDirection === 'right';
              updateRasterAttackSprite(
                sprite,
                riggingVisual.threadlingSpriteUrls[threadling.facingDirection],
                horizontal ? 34 : 29,
                horizontal ? 26 : 29,
                threadling.facingDirection === 'right'
              );
              const isBiting =
                (threadling.attackVisualUntilMs ?? 0) > engine.elapsedTimeMs;
              const bob = Math.sin(
                (engine.elapsedTimeMs - threadling.spawnedAtMs) / 115
              );
              sprite.y = -11 + bob * 1.2 - (isBiting ? 2 : 0);
              if (isBiting) sprite.scale.y *= 1.08;
              const remainingMs = threadling.expiresAtMs - engine.elapsedTimeMs;
              container.alpha = Math.max(0, Math.min(1, remainingMs / 180));
              updateContainerWorldDepth(container, { x: 0, y: 2 });
            }
          }

          // Persistent rubble is separate from dead targetable structures.
          const currentRemnantIds = new Set(
            engine.destroyedStructureVisuals
              .filter((remnant) => remnant.visualStyle === 'prison-gate')
              .map((remnant) => remnant.id)
          );
          for (const [id, container] of destroyedStructureSprites) {
            if (!currentRemnantIds.has(id)) {
              worldLayer.removeChild(container);
              container.destroy({ children: true });
              destroyedStructureSprites.delete(id);
            }
          }
          for (const remnant of engine.destroyedStructureVisuals) {
            if (remnant.visualStyle !== 'prison-gate') continue;
            let container = destroyedStructureSprites.get(remnant.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';
              const sprite = new PIXI.Sprite() as UrlTrackedSprite;
              sprite.label = 'destroyedPrisonGate';
              container.addChild(sprite);
              worldLayer.addChild(container);
              destroyedStructureSprites.set(remnant.id, container);
            }
            container.x = offsetX + (remnant.position.x / 100) * screenW;
            container.y = offsetY + (remnant.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            container.scale.set(zoom * responsiveScale);
            const sprite = container.getChildByLabel(
              'destroyedPrisonGate'
            ) as UrlTrackedSprite;
            updateDestroyedPrisonGate(sprite, remnant, engine.elapsedTimeMs);
            const rubbleLayout = resolvePrisonGateVisualLayout(
              remnant.visualLayout
            ).rubble;
            updateContainerWorldDepth(container, {
              x: rubbleLayout.offsetX,
              y: rubbleLayout.offsetY + rubbleLayout.height / 2,
            });
          }

          captureHaulRopeGraphics.clear();
          for (const captureUnit of engine.captureUnits) {
            if (!captureUnit.groupHauling || !captureUnit.heldByEnemyId) {
              continue;
            }

            const haulers = engine.enemies.filter(
              (enemy) => enemy.heldCaptureUnitId === captureUnit.id
            );
            for (const hauler of haulers) {
              const linkTarget = hauler.captureHaulLinkTargetEnemyId
                ? engine.enemies.find(
                    (enemy) => enemy.id === hauler.captureHaulLinkTargetEnemyId
                  )
                : captureUnit;
              if (!linkTarget) continue;

              const startX = offsetX + (hauler.position.x / 100) * screenW;
              const startY = offsetY + (hauler.position.y / 100) * screenH;
              const endX = offsetX + (linkTarget.position.x / 100) * screenW;
              const endY = offsetY + (linkTarget.position.y / 100) * screenH;
              captureHaulRopeGraphics.moveTo(startX, startY);
              captureHaulRopeGraphics.lineTo(endX, endY);
              captureHaulRopeGraphics.stroke({
                color: 0x111827,
                width: 7 * zoom,
                alpha: 0.9,
              });
              captureHaulRopeGraphics.moveTo(startX, startY);
              captureHaulRopeGraphics.lineTo(endX, endY);
              captureHaulRopeGraphics.stroke({
                color: 0x94a3b8,
                width: 3 * zoom,
                alpha: 0.95,
              });

              const ropeLength = Math.hypot(endX - startX, endY - startY);
              const linkCount = Math.max(
                1,
                Math.floor(ropeLength / Math.max(10, 16 * zoom))
              );
              for (let linkIndex = 1; linkIndex < linkCount; linkIndex++) {
                const progress = linkIndex / linkCount;
                captureHaulRopeGraphics.circle(
                  startX + (endX - startX) * progress,
                  startY + (endY - startY) * progress,
                  2.5 * zoom
                );
                captureHaulRopeGraphics.stroke({
                  color: 0xe2e8f0,
                  width: Math.max(1, zoom),
                  alpha: 0.72,
                });
              }
            }
          }
          airFxLayer.setChildIndex(captureHaulRopeGraphics, 0);

          // --- Render Capture Units ---
          const currentCaptureUnitIds = new Set(
            engine.captureUnits.map((c) => c.id)
          );
          for (const [id, sprite] of captureUnitSprites.entries()) {
            if (!currentCaptureUnitIds.has(id)) {
              worldLayer.removeChild(sprite);
              sprite.destroy({ children: true });
              captureUnitSprites.delete(id);
            }
          }

          for (const capUnit of engine.captureUnits) {
            let container = captureUnitSprites.get(capUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive initially

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'cap_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              worldLayer.addChild(container);

              captureUnitSprites.set(capUnit.id, container);
            }

            // If held, maybe offset slightly so it looks carried,
            // or just render it at the enemy position (with a small Y offset)
            const heldOffset =
              capUnit.heldByEnemyId && !capUnit.groupHauling
                ? screenH * -0.02
                : 0;

            container.x = offsetX + (capUnit.position.x / 100) * screenW;
            container.y =
              offsetY + (capUnit.position.y / 100) * screenH + heldOffset;

            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            // Make it render above the enemy if held (enemy might be index 1 or so, we'll just push to top)
            if (capUnit.heldByEnemyId) {
              worldLayer.setChildIndex(
                container,
                worldLayer.children.length - 1
              );
            }

            const sprite = container.getChildByLabel('cap_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;
            const captureVisualState = getCaptureUnitVisualState(
              capUnit,
              engine.elapsedTimeMs
            );

            if (sprite && shadow) {
              // Hide shadow if held
              shadow.visible =
                !capUnit.heldByEnemyId || Boolean(capUnit.groupHauling);

              applyTDUnitTransforms(
                capUnit,
                sprite,
                shadow,
                capUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                },
                captureVisualState
              );
            }
            renderHealthBar(
              capUnit,
              container,
              capUnit.tdConfigId,
              true /* hideWhenFull */
            );

            const isIndividuallyCarried =
              Boolean(capUnit.heldByEnemyId) && !capUnit.groupHauling;
            const carrier = isIndividuallyCarried
              ? engine.enemies.find(
                  (enemy) => enemy.id === capUnit.heldByEnemyId
                )
              : undefined;
            if (carrier && carrier.kind !== 'structure') {
              const carrierGroundContact = getTDUnitGroundContactOffset(
                carrier,
                carrier.tdConfigId ?? carrier.definitionId
              );
              const carrierX =
                offsetX +
                (carrier.position.x / 100) * screenW +
                carrierGroundContact.x * finalScale;
              const carrierY =
                offsetY +
                (carrier.position.y / 100) * screenH +
                carrierGroundContact.y * finalScale;
              container.zIndex =
                calculateTDWorldDepth(carrierX, carrierY) +
                CARRIED_WORLD_DEPTH_OFFSET;
            } else {
              updateContainerWorldDepth(
                container,
                getTDUnitGroundContactOffset(
                  capUnit,
                  capUnit.tdConfigId,
                  captureVisualState
                )
              );
            }
          }

          // --- Render Towers ---
          const currentTowerKeys = new Set(
            engine.towers.map((t) => `${t.id}_${t.creature.id}`)
          );
          for (const [key, sprite] of towerSprites.entries()) {
            if (!currentTowerKeys.has(key)) {
              worldLayer.removeChild(sprite);
              sprite.destroy({ children: true });
              towerSprites.delete(key);
            }
          }
          for (const tower of engine.towers) {
            const cacheKey = `${tower.id}_${tower.creature.id}`;
            let container = towerSprites.get(cacheKey);
            if (!container) {
              const newContainer = new PIXI.Container();
              container = newContainer;

              newContainer.eventMode = tower.isFixed ? 'none' : 'static';
              newContainer.cursor = tower.isFixed ? 'default' : 'grab';
              if (!tower.isFixed) {
                newContainer.on(
                  'pointerdown',
                  (event: PIXI.FederatedPointerEvent) => {
                    if (
                      dragPointerRef.current ||
                      event.button !== 0 ||
                      isOpeningPanActiveRef.current
                    )
                      return;
                    draggingNode = newContainer;
                    draggingTowerCreatureId = tower.creature.id;
                    dragPointerRef.current = {
                      clientX: event.clientX,
                      clientY: event.clientY,
                      pointerType: event.pointerType,
                      pointerId: event.pointerId,
                      type: 'tower',
                      source: 'internal',
                    };
                    app.canvas.setPointerCapture(event.pointerId);
                    updateDraggedPosition();
                    newContainer.cursor = 'grabbing';
                    newContainer.zIndex = DRAGGED_WORLD_DEPTH;
                    worldLayer.setChildIndex(
                      newContainer,
                      worldLayer.children.length - 1
                    );
                    if (onDragStateChangeRef.current) {
                      onDragStateChangeRef.current(true);
                    }
                  }
                );
              }

              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const tsprite = new PIXI.Sprite();
              tsprite.label = 'tower_sprite';
              tsprite.anchor.set(0.5);
              container.addChildAt(tsprite, 1);

              const rangeCircle = new PIXI.Graphics();
              rangeCircle.label = 'rangeCircle';
              container.addChild(rangeCircle);

              worldLayer.addChild(container);
              towerSprites.set(cacheKey, container);
            }
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            if (draggingTowerCreatureId !== tower.creature.id) {
              container.x = offsetX + (tower.position.x / 100) * screenW;
              container.y = offsetY + (tower.position.y / 100) * screenH;
              container.scale.set(finalScale);
            }

            const rCircle = container.getChildByLabel('rangeCircle') as
              | PIXI.Graphics
              | undefined;
            if (rCircle) {
              rCircle.visible = draggingTowerCreatureId === tower.creature.id;
              if (rCircle.visible) {
                const attackInstance =
                  tower.equippedAttacksRuntime[tower.selectedAttackIndex];
                const rangeIndex = attackInstance
                  ? ATTACK_DEFS[attackInstance.definitionId]?.rangeIndex
                  : undefined;
                rCircle.clear();
                if (rangeIndex !== undefined && finalScale > 0) {
                  const radius = getTDRangePreviewRadius(
                    engine.getTowerAttackRange(rangeIndex),
                    viewportH,
                    zoom
                  );
                  rCircle.circle(0, 0, radius / finalScale);
                  rCircle.fill({ color: 0x22d3ee, alpha: 0.05 });
                  rCircle.stroke({
                    color: 0x22d3ee,
                    alpha: 0.3,
                    width: 1,
                  });
                }
              }
            }

            const tsprite = container.getChildByLabel('tower_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (tsprite && shadow) {
              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;
              applyTDUnitTransforms(
                tower,
                tsprite,
                shadow,
                tower.creature.speciesId,
                baseCreature?.battleSpriteUrl || baseCreature?.spriteUrl,
                (t) => {
                  if (!isDestroyed) tsprite.texture = t;
                }
              );
              const heatStacks = Math.min(
                3,
                Math.max(0, tower.fireClawHeat?.stacks ?? 0)
              );
              if (heatStacks > 0 && (tower.damageFlashTimerMs ?? 0) <= 0) {
                tsprite.tint = FIRE_CLAW_TOWER_TINTS[heatStacks];
              }
              updateShikoQuakeTowerPose(
                tsprite,
                shadow,
                tower,
                engine.elapsedTimeMs
              );
              updatePalmSlamTowerPose(
                tsprite,
                shadow,
                tower,
                engine.elapsedTimeMs
              );
              updateSharedSlumberTowerVisual(
                container,
                tsprite,
                shadow,
                tower,
                engine.elapsedTimeMs
              );
              updateFunnyDanceTowerPose(tsprite, tower, engine.elapsedTimeMs);
              updateWakeWhipTowerPose(tsprite, tower, engine.elapsedTimeMs);
              updateTowerParalysisVisual(
                container,
                tsprite,
                tower,
                engine.elapsedTimeMs
              );

              // Fade tower if it's currently performing a Tackle attack
              const isTackling = engine.projectiles.some(
                (p) =>
                  p.sourceId === tower.id &&
                  p.attackDefinitionId === AttackId.TACKLE
              );
              tsprite.alpha = isTackling ? 0 : 1;
              shadow.alpha = isTackling ? 0 : 1;
            }
            renderHealthBar(
              tower,
              container,
              tower.creature.speciesId,
              true /* hideWhenFull */
            );
            updateSparkles(container, tower, app.ticker.deltaTime);
            updateRallyIndicator(container, tower, engine.elapsedTimeMs);
            updateWarmthIndicator(container, tower, engine.elapsedTimeMs);
            updateSpeedBoostIndicator(
              container,
              tower,
              tower.creature.speciesId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            updatePersistentSpeedStackAura(
              container,
              tower,
              app.ticker.deltaTime
            );
            updateDefenseBoostIndicator(
              container,
              tower,
              tower.creature.speciesId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );

            const hpBg = container.getChildByLabel('hpBg') as
              | PIXI.Graphics
              | undefined;
            const hpFg = container.getChildByLabel('hpFg') as
              | PIXI.Graphics
              | undefined;
            // Check if tower is currently doing a Dash Attack
            // It disappears if any of its active projectiles are dash attacks
            const isDashing = engine.projectiles.some((p) => {
              if (p.sourceId !== tower.id || !p.attackDefinitionId)
                return false;
              const def = ATTACK_DEFS[p.attackDefinitionId];
              return def && def.isDashAttack;
            });

            const grippedTarget = tower.deepwaterGrip
              ? engine.enemies.find(
                  (enemy) => enemy.id === tower.deepwaterGrip!.targetId
                )
              : undefined;
            if (grippedTarget) {
              container.x =
                offsetX +
                (grippedTarget.position.x / 100) * screenW +
                32 * finalScale;
              container.y =
                offsetY +
                (grippedTarget.position.y / 100) * screenH -
                5 * finalScale;
            }
            updateDeepwaterBreath(container, tower, engine.elapsedTimeMs);
            if (isDashing) {
              container.alpha = 0;
            } else {
              container.alpha = 1;
            }
            if (draggingTowerCreatureId === tower.creature.id) {
              container.zIndex = DRAGGED_WORLD_DEPTH;
            } else {
              updateContainerWorldDepth(
                container,
                getTDUnitGroundContactOffset(tower, tower.creature.speciesId)
              );
            }
          }

          // --- Render Placement Spots & Capture Hover ---
          spotGraphics.clear();
          invalidSpotGraphics.clear();
          recoveryTutorialGraphics.clear();
          resonantEvolutionGraphics.clear();

          if (!resonantEvolutionGraphics.parent) {
            groundFxLayer.addChildAt(
              resonantEvolutionGraphics,
              Math.min(1, groundFxLayer.children.length)
            );
          }

          groundFxLayer.addChild(spotGraphics); // Ensure ground interactions stay together
          groundFxLayer.addChild(invalidSpotGraphics);
          groundFxLayer.addChild(recoveryTutorialGraphics);
          groundFxLayer.setChildIndex(
            spotGraphics,
            groundFxLayer.children.length - 3
          );
          groundFxLayer.setChildIndex(
            invalidSpotGraphics,
            groundFxLayer.children.length - 2
          );
          groundFxLayer.setChildIndex(
            recoveryTutorialGraphics,
            groundFxLayer.children.length - 1
          );

          const healingTutorialCreatureId =
            healingTutorialTowerCreatureIdRef.current;
          const tutorialTower = healingTutorialCreatureId
            ? engine.towers.find(
                (tower) => tower.creature.id === healingTutorialCreatureId
              )
            : undefined;
          if (tutorialTower && engine.towerRecovery) {
            const pulse = 0.5 + Math.sin(performance.now() / 180) * 0.18;
            const recoverySpots = engine.towerRecovery.placementSpotIndices
              .map((index) => engine.placementSpots[index])
              .filter((spot): spot is Point => !!spot);

            for (const spot of recoverySpots) {
              const spotX = offsetX + (spot.x / 100) * screenW;
              const spotY = offsetY + (spot.y / 100) * screenH;
              const radius = viewportH * 0.055 * zoom;
              recoveryTutorialGraphics.circle(spotX, spotY, radius);
              recoveryTutorialGraphics.fill({
                color: 0x22c55e,
                alpha: pulse * 0.35,
              });
              recoveryTutorialGraphics.stroke({
                color: 0x86efac,
                alpha: 0.95,
                width: Math.max(3, viewportH * 0.004 * zoom),
              });
            }

            const targetSpot = recoverySpots.reduce<Point | undefined>(
              (closest, spot) => {
                if (!closest) return spot;
                const currentDistance =
                  (spot.x - tutorialTower.position.x) ** 2 +
                  (spot.y - tutorialTower.position.y) ** 2;
                const closestDistance =
                  (closest.x - tutorialTower.position.x) ** 2 +
                  (closest.y - tutorialTower.position.y) ** 2;
                return currentDistance < closestDistance ? spot : closest;
              },
              undefined
            );

            if (targetSpot) {
              const startX =
                offsetX + (tutorialTower.position.x / 100) * screenW;
              const startY =
                offsetY + (tutorialTower.position.y / 100) * screenH;
              const endX = offsetX + (targetSpot.x / 100) * screenW;
              const endY = offsetY + (targetSpot.y / 100) * screenH;
              const controlX = (startX + endX) / 2 + viewportH * 0.05;
              const controlY = (startY + endY) / 2;

              recoveryTutorialGraphics.circle(
                startX,
                startY,
                viewportH * 0.06 * zoom
              );
              recoveryTutorialGraphics.stroke({
                color: 0xfde047,
                alpha: 0.95,
                width: Math.max(3, viewportH * 0.004 * zoom),
              });
              recoveryTutorialGraphics.moveTo(startX, startY);
              recoveryTutorialGraphics.quadraticCurveTo(
                controlX,
                controlY,
                endX,
                endY
              );
              recoveryTutorialGraphics.stroke({
                color: 0xfde047,
                alpha: 0.9,
                width: Math.max(3, viewportH * 0.005 * zoom),
              });

              const angle = Math.atan2(endY - controlY, endX - controlX);
              const arrowSize = Math.max(10, viewportH * 0.018 * zoom);
              recoveryTutorialGraphics.poly([
                endX,
                endY,
                endX - Math.cos(angle - Math.PI / 5) * arrowSize,
                endY - Math.sin(angle - Math.PI / 5) * arrowSize,
                endX - Math.cos(angle + Math.PI / 5) * arrowSize,
                endY - Math.sin(angle + Math.PI / 5) * arrowSize,
              ]);
              recoveryTutorialGraphics.fill({ color: 0xfde047, alpha: 0.95 });
            }
          }

          let isHoveringValidSpot = false;

          if (isDraggingCapture) {
            // Capture Device Logic
            let targetedEnemyId: string | null = null;
            let isWeakened = false;

            if (dragPosRef.current) {
              let minSqDist = Infinity;
              const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

              // Find closest enemy
              engine.enemies.forEach((enemy) => {
                const dx = dragPosRef.current!.x - enemy.position.x;
                const dy = dragPosRef.current!.y - enemy.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
                  minSqDist = distSq;
                  targetedEnemyId = enemy.id;
                  isWeakened = isUnitWeakened(enemy);
                }
              });

              if (targetedEnemyId) {
                const enemy = engine.enemies.find(
                  (e) => e.id === targetedEnemyId
                )!;
                const isValidCapture = isWeakened && !enemy.uncapturable;

                isHoveringValidSpot = isValidCapture;

                const pxX = offsetX + (enemy.position.x / 100) * screenW;
                const pxY = offsetY + (enemy.position.y / 100) * screenH;
                const radius = viewportH * 0.05 * zoom;

                if (isValidCapture) {
                  // Green circle for valid capture
                  spotGraphics.circle(pxX, pxY, radius);
                  spotGraphics.fill({ color: 0x22c55e, alpha: 0.3 }); // Transparent green
                  spotGraphics.stroke({
                    color: 0x22c55e,
                    alpha: 1,
                    width: 4,
                  });
                } else {
                  // Red X for invalid capture (not weakened enough)
                  invalidSpotGraphics.circle(pxX, pxY, radius);
                  invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 });
                  invalidSpotGraphics.stroke({
                    color: 0xef4444,
                    alpha: 0.8,
                    width: 3,
                  });

                  const crossSize = radius * 0.5;
                  invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
                  invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
                  invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
                  invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
                  invalidSpotGraphics.stroke({
                    color: 0xef4444,
                    width: 4,
                    join: 'round',
                    cap: 'round',
                  });
                }
              }
            }
          } else if (isDraggingTower) {
            if (hoveringLaunch) isHoveringValidSpot = true;
            // Normal Tower Placement Logic
            if (draggingTowerCreatureId === null && dragPosRef.current) {
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const creatureId = externalDraggingTowerIdRef.current;
              const creature = creatureId
                ? engine.roster.find((candidate) => candidate.id === creatureId)
                : undefined;
              const equippedAttacks = creature
                ? TowerDefenseEngine.getEquippedAttacks(creature)
                : [];
              const selectedAttackIndex = creature
                ? (engine.playerSelectedAttacks[creature.id] ??
                  creature.activeAttackIndex ??
                  0)
                : 0;
              const attackId = equippedAttacks[selectedAttackIndex];
              const rangeIndex = attackId
                ? ATTACK_DEFS[attackId]?.rangeIndex
                : undefined;

              if (rangeIndex !== undefined && !hoveringLaunch) {
                const radius = getTDRangePreviewRadius(
                  engine.getTowerAttackRange(rangeIndex),
                  viewportH,
                  zoom
                );
                spotGraphics.circle(pxX, pxY, radius);
                spotGraphics.fill({ color: 0x22d3ee, alpha: 0.05 });
                spotGraphics.stroke({
                  color: 0x22d3ee,
                  alpha: 0.3,
                  width: 1,
                });
              }
            }

            engine.placementSpots.forEach((spot) => {
              const pxX = offsetX + (spot.x / 100) * screenW;
              const pxY = offsetY + (spot.y / 100) * screenH;

              const isHovered = hoveredSpot === spot;
              if (isHovered) isHoveringValidSpot = true;

              const strokeWidth = isHovered ? 4 : 2;
              const alpha = isHovered ? 1 : 0.8;
              let baseColor = 0xf97316; // Orange

              if (engine.isSpotOccupied(spot.x, spot.y)) {
                // Let's color occupied spots differently while dragging to indicate swap!
                // blue-ish if occupied! Wait, let's keep it orange to stay consistent but it proves it works.
                baseColor = 0xf97316;
              }

              if (isHovered) {
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom); // 5vh radius
                spotGraphics.fill({ color: baseColor, alpha: 0.3 }); // Transparent
                spotGraphics.stroke({
                  color: baseColor,
                  alpha: alpha,
                  width: strokeWidth,
                }); // Solid thicker border
              } else {
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom);
                spotGraphics.stroke({
                  color: baseColor,
                  alpha: alpha,
                  width: strokeWidth,
                }); // Standard outline
              }
            });

            // If dragging tower but not hovering a valid open spot, show error indicator
            if (
              dragPosRef.current &&
              !isHoveringValidSpot &&
              dragPosRef.current
            ) {
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const radius = viewportH * 0.05 * zoom;

              invalidSpotGraphics.circle(pxX, pxY, radius);
              invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 }); // Transparent red
              invalidSpotGraphics.stroke({
                color: 0xef4444,
                alpha: 0.8,
                width: 3,
              }); // Solid red border

              // Draw an X
              const crossSize = radius * 0.5;
              invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
              invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
              invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
              invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
              invalidSpotGraphics.stroke({
                color: 0xef4444,
                width: 4,
                join: 'round',
                cap: 'round',
              });
            }
          }

          // --- Render Enemies ---
          engine.enemies.forEach((enemy) => {
            const state = enemy.resonantEvolutionState;
            if (!state) return;
            const linkTarget = state.linkTargetEnemyId
              ? engine.enemies.find(
                  (candidate) => candidate.id === state.linkTargetEnemyId
                )
              : engine.captureUnits.find(
                  (captureUnit) => captureUnit.id === state.captureUnitId
                );
            if (!linkTarget) return;

            resonantEvolutionGraphics.moveTo(
              offsetX + (enemy.position.x / 100) * screenW,
              offsetY + (enemy.position.y / 100) * screenH
            );
            resonantEvolutionGraphics.lineTo(
              offsetX + (linkTarget.position.x / 100) * screenW,
              offsetY + (linkTarget.position.y / 100) * screenH
            );
            resonantEvolutionGraphics.stroke({
              color: 0x67e8f9,
              alpha: state.phase === 'channeling' ? 0.9 : 0.58,
              width: Math.max(
                2,
                (state.phase === 'channeling' ? 4 : 2.5) * zoom
              ),
              cap: 'round',
              join: 'round',
            });
          });

          const currentEnemyIds = new Set(engine.enemies.map((e) => e.id));
          for (const [id, sprite] of enemySprites.entries()) {
            if (!currentEnemyIds.has(id)) {
              worldLayer.removeChild(sprite);
              sprite.destroy({ children: true });
              enemySprites.delete(id);
            }
          }
          for (const enemy of engine.enemies) {
            let container = enemySprites.get(enemy.id);
            if (!container) {
              container = new PIXI.Container();

              if (enemy.kind === 'structure') {
                container.eventMode = 'static';
                container.cursor = 'pointer';
                if (enemy.structureVisualStyle === 'prison-gate') {
                  const layout = resolvePrisonGateVisualLayout(
                    enemy.structureVisualLayout
                  );
                  const standing = layout.standing;
                  const top = Math.min(
                    standing.offsetY - standing.height / 2,
                    layout.labelOffsetY
                  );
                  container.hitArea = new PIXI.Rectangle(
                    standing.offsetX - standing.width / 2 - 8,
                    top - 16,
                    standing.width + 16,
                    standing.offsetY + standing.height / 2 - top + 32
                  );
                } else {
                  container.hitArea = new PIXI.Rectangle(-58, -112, 116, 130);
                }
                container.on(
                  'pointerdown',
                  (event: PIXI.FederatedPointerEvent) => {
                    event.stopPropagation();
                    onStructureFocusedRef.current?.(enemy.id);
                  }
                );
              }

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const esprite = new PIXI.Sprite();
              esprite.label = 'enemy_sprite';
              esprite.anchor.set(0.5);
              container.addChildAt(esprite, 1);

              worldLayer.addChild(container);
              enemySprites.set(enemy.id, container);
            }
            container.x = offsetX + (enemy.position.x / 100) * screenW;
            container.y = offsetY + (enemy.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            const esprite = container.getChildByLabel('enemy_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (enemy.kind === 'structure') {
              if (esprite) esprite.visible = false;
              if (shadow) shadow.visible = false;
              if (enemy.structureVisualStyle === 'prison-gate') {
                updatePrisonGateVisual(container, enemy);
              }
              updateStructureLabel(
                container,
                enemy,
                engine.focusedStructureId === enemy.id
              );
            } else if (esprite && shadow) {
              esprite.visible = true;
              shadow.visible = true;
              const baseCreature =
                typeof enemy.definitionId === 'number'
                  ? TD_CREATURE_DEFS[enemy.definitionId]?.baseCreature
                  : undefined;
              applyTDUnitTransforms(
                enemy,
                esprite,
                shadow,
                enemy.definitionId,
                baseCreature?.battleSpriteUrl || baseCreature?.spriteUrl,
                (t) => {
                  if (!isDestroyed) esprite.texture = t;
                }
              );
              updateLaneHopVisual(
                container,
                esprite,
                shadow,
                enemy,
                screenW,
                screenH,
                finalScale
              );
              updateFunnyDanceEnemyPose(esprite, enemy, engine.elapsedTimeMs);
            }

            renderHealthBar(
              enemy,
              container,
              enemy.tdConfigId ?? enemy.definitionId,
              false,
              enemy.kind === 'structure' &&
                enemy.structureVisualStyle === 'prison-gate'
                ? resolvePrisonGateVisualLayout(enemy.structureVisualLayout)
                    .healthBarOffsetY
                : undefined
            );
            updateScouredIndicator(container, enemy, engine.elapsedTimeMs);
            updateDeepwaterCoils(
              container,
              enemy,
              engine.towers.find(
                (tower) => tower.id === enemy.constrictedByTowerId
              ),
              engine.elapsedTimeMs
            );
            updateFuseRushMarks(
              container,
              enemy.fuseRushMarks ?? 0,
              engine.elapsedTimeMs
            );
            updateSailcutterMark(container, enemy, engine.elapsedTimeMs);
            if (enemy.kind !== 'structure') {
              updateSparkles(container, enemy, app.ticker.deltaTime);
              updateSpeedBoostIndicator(
                container,
                enemy,
                enemy.definitionId,
                engine.elapsedTimeMs,
                app.ticker.deltaTime
              );
              updatePersistentSpeedStackAura(
                container,
                enemy,
                app.ticker.deltaTime
              );
              updateSpeedSlowIndicator(
                container,
                enemy,
                engine.elapsedTimeMs,
                app.ticker.deltaTime
              );
              updateDefenseBoostIndicator(
                container,
                enemy,
                enemy.definitionId,
                engine.elapsedTimeMs,
                app.ticker.deltaTime
              );
              updateResonantEvolutionIndicator(
                container,
                enemy,
                engine.elapsedTimeMs,
                app.ticker.deltaTime
              );
              if (esprite) {
                updateCursedAura(
                  container,
                  enemy,
                  esprite,
                  app.ticker.deltaTime
                );
                updateDrenchedAura(
                  container,
                  enemy,
                  esprite,
                  app.ticker.deltaTime
                );
                updatePoisonIndicator(
                  container,
                  enemy,
                  esprite,
                  enemy.tdConfigId ?? enemy.definitionId,
                  app.ticker.deltaTime
                );
                updateSleepIndicator(
                  container,
                  enemy,
                  esprite,
                  enemy.tdConfigId ?? enemy.definitionId,
                  engine.elapsedTimeMs
                );
                updateSleepResistanceIndicator(
                  container,
                  enemy,
                  enemy.tdConfigId ?? enemy.definitionId,
                  engine.elapsedTimeMs
                );
              }
            }

            if (
              enemy.kind === 'structure' &&
              enemy.structureVisualStyle === 'prison-gate'
            ) {
              const standingLayout = resolvePrisonGateVisualLayout(
                enemy.structureVisualLayout
              ).standing;
              updateContainerWorldDepth(container, {
                x: standingLayout.offsetX,
                y: standingLayout.offsetY + standingLayout.height / 2,
              });
            } else {
              updateContainerWorldDepth(
                container,
                getTDUnitGroundContactOffset(
                  enemy,
                  enemy.tdConfigId ?? enemy.definitionId
                )
              );
            }
          }

          // --- Render clustered off-screen enemy indicators ---
          const offscreenIndicators = hideUiRef.current
            ? []
            : buildTDOffscreenIndicators(
                engine.enemies
                  .filter((enemy) => enemy.hp > 0)
                  .map((enemy) => ({
                    id: enemy.id,
                    x: offsetX + (enemy.position.x / 100) * screenW,
                    y: offsetY + (enemy.position.y / 100) * screenH,
                    isObjectiveCarrier: Boolean(enemy.heldCaptureUnitId),
                  })),
                app.screen.width,
                app.screen.height
              );
          const currentIndicatorIds = new Set(
            offscreenIndicators.map((indicator) => indicator.id)
          );
          for (const [id, container] of offscreenEnemyIndicatorSprites) {
            if (!currentIndicatorIds.has(id)) {
              hudLayer.removeChild(container);
              container.destroy({ children: true });
              offscreenEnemyIndicatorSprites.delete(id);
            }
          }
          for (const indicator of offscreenIndicators) {
            let container = offscreenEnemyIndicatorSprites.get(indicator.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';

              const graphics = new PIXI.Graphics();
              graphics.label = 'indicator_graphics';
              container.addChild(graphics);

              hudLayer.addChild(container);
              offscreenEnemyIndicatorSprites.set(indicator.id, container);
            }

            const graphics = container.getChildByLabel(
              'indicator_graphics'
            ) as PIXI.Graphics;
            const directionX = Math.cos(indicator.angle);
            const directionY = Math.sin(indicator.angle);
            const tangentX = -directionY;
            const tangentY = directionX;
            const color = indicator.hasObjectiveCarrier ? 0xef4444 : 0xf97316;
            const pulse =
              1 +
              (indicator.hasObjectiveCarrier
                ? Math.sin(engine.elapsedTimeMs / 140) * 0.12
                : 0);

            graphics.clear();
            graphics.circle(0, 0, 18 * pulse);
            graphics.fill({ color: 0x0f172a, alpha: 0.86 });
            graphics.stroke({ color, alpha: 1, width: 3 });
            graphics.poly([
              directionX * 12,
              directionY * 12,
              -directionX * 7 + tangentX * 7,
              -directionY * 7 + tangentY * 7,
              -directionX * 7 - tangentX * 7,
              -directionY * 7 - tangentY * 7,
            ]);
            graphics.fill({ color, alpha: 1 });

            container.x = indicator.x;
            container.y = indicator.y;
            hudLayer.setChildIndex(container, hudLayer.children.length - 1);
          }

          // --- Render Projectiles ---
          const trailNow = performance.now();
          const currentProjIds = new Set(engine.projectiles.map((p) => p.id));
          for (const [id, container] of projectileSprites.entries()) {
            if (!currentProjIds.has(id)) {
              airFxLayer.removeChild(container);
              container.destroy({ children: true });
              projectileSprites.delete(id);
            }
          }
          for (const proj of engine.projectiles) {
            let container = projectileSprites.get(proj.id);
            if (!container) {
              container = new PIXI.Container();

              const def = proj.attackDefinitionId
                ? ATTACK_DEFS[proj.attackDefinitionId]
                : undefined;

              if (def?.rollingBarrel) {
                createBarrelBowlingVisual(container);
              } else if (def && def.isDashAttack) {
                if (def.dashTrailType) {
                  const trail = new PIXI.Graphics();
                  trail.label = 'dash_trail';
                  if (def.dashTrailType === 'FIRE') drawFuseRushTrail(trail);
                  else drawWaterDashTrail(trail);
                  container.addChild(trail);
                }

                const shadow = new PIXI.Graphics();
                shadow.label = 'shadow';
                container.addChild(shadow);

                const psprite = new PIXI.Sprite();
                psprite.label = 'proj_sprite';
                psprite.anchor.set(0.5);
                container.addChild(psprite);
              } else if (
                def?.projectileVisual?.type === 'STATIC_YIP' ||
                def?.projectileVisual?.type === 'SPARK' ||
                def?.projectileVisual?.type === 'GRUMBLE'
              ) {
                const bolt = new PIXI.Graphics();
                bolt.label = 'proj_graphics';
                if (def.projectileVisual.type === 'SPARK') {
                  drawSparkProjectile(bolt, def.projectileVisual);
                } else if (def.projectileVisual.type === 'GRUMBLE') {
                  drawGrumbleProjectile(bolt, def.projectileVisual);
                }
                container.addChild(bolt);
              } else if (def?.projectileVisual?.type === 'REVERIE_ORB') {
                const pearl = new PIXI.Graphics();
                pearl.label = 'proj_graphics';
                container.addChild(pearl);
              } else if (def?.projectileVisual?.type === 'FLAME') {
                const flame = new PIXI.Graphics();
                flame.label = 'proj_graphics';
                drawProjectileFlame(
                  flame,
                  def.projectileVisual.outerColor,
                  def.projectileVisual.innerColor
                );
                container.addChild(flame);
              } else if (def?.projectileVisual?.type === 'WAKE_WHIP') {
                const wave = new PIXI.Sprite();
                wave.label = 'wake_whip_wave';
                wave.anchor.set(0.5);
                wave.visible = false;
                container.addChild(wave);
                void PIXI.Assets.load(def.projectileVisual.spriteUrl).then(
                  (texture) => {
                    if (wave.destroyed) return;
                    wave.texture = texture as PIXI.Texture;
                    wave.width = 72;
                    wave.height = 32;
                    wave.visible = true;
                  }
                );
              } else if (def?.projectileVisual?.type === 'SALT_SPIT') {
                const salt = new PIXI.Sprite();
                salt.label = 'salt_spit_crystals';
                salt.anchor.set(0.5);
                salt.visible = false;
                container.addChild(salt);
                void PIXI.Assets.load(def.projectileVisual.spriteUrl).then(
                  (texture) => {
                    if (salt.destroyed) return;
                    salt.texture = texture as PIXI.Texture;
                    salt.width = 50;
                    salt.height = 20;
                    salt.visible = true;
                  }
                );
              } else if (
                def?.projectileVisual?.type === 'WATER_STREAM' ||
                def?.projectileVisual?.type === 'VENOM_STREAM'
              ) {
                const water = new PIXI.Graphics();
                water.label = 'proj_graphics';
                drawWaterStreamSegment(
                  water,
                  def.projectileVisual.outerColor,
                  def.projectileVisual.innerColor,
                  def.projectileVisual.highlightColor
                );
                container.addChild(water);
              } else if (def?.projectileVisual?.type === 'NECTAR_TONGUE') {
                const tongue = new PIXI.Sprite();
                tongue.label = 'proj_graphics';
                tongue.anchor.set(0.5);
                container.addChild(tongue);
                void PIXI.Assets.load(def.projectileVisual.spriteUrl).then(
                  (texture) => {
                    if (tongue.destroyed) return;
                    tongue.texture = texture as PIXI.Texture;
                    tongue.width = 72;
                    tongue.height = 72;
                  }
                );
              } else if (def?.projectileVisual?.type === 'COIR_BOLA') {
                drawCoirBola(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.fiberColor,
                  def.projectileVisual.highlightColor,
                  def.projectileVisual.sparkColor
                );
              } else if (def?.projectileVisual?.type === 'STRING_COIL') {
                drawCoirBola(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.fiberColor,
                  def.projectileVisual.highlightColor,
                  def.projectileVisual.sparkColor
                );
              } else if (def?.projectileVisual?.type === 'SAILCUTTER') {
                drawSailcutterProjectile(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.windColor,
                  def.projectileVisual.highlightColor
                );
              } else if (def?.projectileVisual?.type === 'FLYING_COLORS') {
                const feather = new PIXI.Sprite();
                feather.label = 'flying_colors_feather';
                feather.anchor.set(0.5);
                feather.visible = false;
                container.addChild(feather);
                void PIXI.Assets.load(def.projectileVisual.spriteUrl).then(
                  (texture) => {
                    if (feather.destroyed) return;
                    feather.texture = texture as PIXI.Texture;
                    feather.width = 48;
                    feather.height = 24;
                    feather.visible = true;
                  }
                );

                const graphics = new PIXI.Graphics();
                graphics.label = 'flying_colors_trail';
                graphics.eventMode = 'none';
                airFxLayer.addChild(graphics);
                flyingColorsTrails.set(proj.id, {
                  graphics,
                  points: [],
                  color:
                    FLYING_COLORS_TRAIL_PALETTE[
                      (proj.flyingColorsHitIds?.length ?? 0) %
                        FLYING_COLORS_TRAIL_PALETTE.length
                    ],
                });
              } else {
                const g = new PIXI.Graphics();
                g.label = 'proj_graphics';
                g.circle(0, 0, 8);

                let projColor = 0x22d3ee; // Default cyan
                if (proj.attackDefinitionId) {
                  const def = ATTACK_DEFS[proj.attackDefinitionId];
                  if (def) {
                    projColor = TYPE_COLORS[def.type] || projColor;
                  }
                }

                g.fill({ color: projColor });
                container.addChild(g);
              }

              airFxLayer.addChild(container);
              projectileSprites.set(proj.id, container);
            }

            container.x = offsetX + (proj.position.x / 100) * screenW;
            container.y = offsetY + (proj.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale * (proj.visualScale ?? 1));

            const def = proj.attackDefinitionId
              ? ATTACK_DEFS[proj.attackDefinitionId]
              : undefined;

            if (
              def?.projectileVisual?.type === 'STATIC_YIP' ||
              def?.projectileVisual?.type === 'SPARK' ||
              def?.projectileVisual?.type === 'GRUMBLE'
            ) {
              if (def.projectileVisual.type === 'STATIC_YIP') {
                drawStaticYipProjectile(
                  container.getChildByLabel('proj_graphics') as PIXI.Graphics,
                  def.projectileVisual,
                  engine.elapsedTimeMs
                );
              }
              const sourceTower = engine.towers.find(
                (tower) => tower.id === proj.sourceId
              );
              const sourceSprite = towerSprites
                .get(`${proj.sourceId}_${sourceTower?.creature.id}`)
                ?.getChildByLabel('tower_sprite') as PIXI.Sprite | undefined;
              const mouth = sourceSprite
                ? getElectricAttackSockets(
                    sourceSprite,
                    proj.launchFacingDirection ?? 'right'
                  ).mouth
                : { x: 0, y: -30 };
              const progress = getElectricAttackFlightProgress(
                proj.origin ?? proj.position,
                proj.position,
                proj.target
              );
              // Interpolate only the rendered offset: damage/range stay in world units.
              const impactY = -24;
              container.x += mouth.x * (1 - progress) * finalScale;
              container.y +=
                (mouth.y * (1 - progress) + impactY * progress) * finalScale;
              const targetX = offsetX + (proj.target.x / 100) * screenW;
              const targetY =
                offsetY +
                (proj.target.y / 100) * screenH +
                impactY * finalScale;
              container.rotation = Math.atan2(
                targetY - container.y,
                targetX - container.x
              );
            } else if (def?.projectileVisual?.type === 'REVERIE_ORB') {
              drawReverieOrbProjectile(
                container.getChildByLabel('proj_graphics') as PIXI.Graphics,
                def.projectileVisual,
                engine.elapsedTimeMs
              );
              const sourceTower = engine.towers.find(
                (tower) => tower.id === proj.sourceId
              );
              const sourceSprite = towerSprites
                .get(`${proj.sourceId}_${sourceTower?.creature.id}`)
                ?.getChildByLabel('tower_sprite') as PIXI.Sprite | undefined;
              const socket = sourceSprite
                ? getDormateeOrbSocket(
                    sourceSprite,
                    proj.launchFacingDirection ?? 'right'
                  )
                : { x: 0, y: -75 };
              const progress = getElectricAttackFlightProgress(
                proj.origin ?? proj.position,
                proj.position,
                proj.target
              );
              const origin = proj.origin ?? proj.position;
              const wave = getReverieOrbWaveOffset(
                progress,
                ((proj.target.x - origin.x) / 100) * screenW -
                  socket.x * finalScale,
                ((proj.target.y - origin.y) / 100) * screenH -
                  (24 + socket.y) * finalScale
              );
              container.x += (socket.x * (1 - progress) + wave.x) * finalScale;
              container.y +=
                (socket.y * (1 - progress) - 24 * progress + wave.y) *
                finalScale;
              container.rotation = 0;
            } else if (def?.projectileVisual?.type === 'NECTAR_TONGUE') {
              const flightProgress = getElectricAttackFlightProgress(
                proj.origin ?? proj.position,
                proj.position,
                proj.target
              );
              const lickProgress = Math.max(
                0,
                Math.min(1, (flightProgress - 0.3) / 0.7)
              );
              const easedProgress = 1 - Math.pow(1 - lickProgress, 2);
              container.x = offsetX + (proj.target.x / 100) * screenW;
              container.y =
                offsetY +
                (proj.target.y / 100) * screenH +
                (28 - easedProgress * 56) * finalScale;
              container.alpha = Math.min(1, lickProgress / 0.16);
              container.rotation = 0;
            } else if (def?.projectileVisual?.type === 'FLYING_COLORS') {
              const travelX = proj.target.x - proj.position.x;
              const travelY = proj.target.y - proj.position.y;
              const direction = Math.atan2(travelY, travelX);
              const progress = getElectricAttackFlightProgress(
                proj.origin ?? proj.position,
                proj.position,
                proj.target
              );
              const arc = Math.sin(progress * Math.PI) * 10 * finalScale;
              const side = (proj.flyingColorsHitIds?.length ?? 0) % 2 ? -1 : 1;
              container.x -= Math.sin(direction) * arc * side;
              container.y += Math.cos(direction) * arc * side;
              container.rotation =
                direction + Math.sin(engine.elapsedTimeMs / 85) * 0.07;

              const trail = flyingColorsTrails.get(proj.id);
              if (trail) {
                const last = trail.points[trail.points.length - 1];
                if (
                  !last ||
                  Math.hypot(container.x - last.x, container.y - last.y) > 2
                ) {
                  trail.points.push({
                    x: container.x,
                    y: container.y,
                    time: trailNow,
                  });
                  if (trail.points.length > 24) trail.points.shift();
                }
              }
            } else if (
              def?.projectileVisual?.type === 'FLAME' ||
              def?.projectileVisual?.type === 'WAKE_WHIP' ||
              def?.projectileVisual?.type === 'SALT_SPIT' ||
              def?.projectileVisual?.type === 'WATER_STREAM' ||
              def?.projectileVisual?.type === 'VENOM_STREAM' ||
              def?.projectileVisual?.type === 'COIR_BOLA' ||
              def?.projectileVisual?.type === 'STRING_COIL' ||
              def?.projectileVisual?.type === 'SAILCUTTER'
            ) {
              const travelX = proj.target.x - proj.position.x;
              const travelY = proj.target.y - proj.position.y;
              container.rotation = Math.atan2(travelY, travelX);
            } else {
              container.rotation = 0;
            }

            if (
              def?.projectileVisual?.type === 'COIR_BOLA' ||
              def?.projectileVisual?.type === 'STRING_COIL'
            ) {
              const core = container.getChildByLabel('coir_bola_core') as
                | PIXI.Container
                | undefined;
              if (core) {
                core.rotation += 0.3 * app.ticker.deltaTime;
              }
            }

            if (def?.rollingBarrel && proj.rollingBarrel) {
              updateBarrelBowlingVisual(container, proj, def);
            }

            if (def && def.isDashAttack) {
              const trail = container.getChildByLabel('dash_trail') as
                | PIXI.Graphics
                | undefined;
              if (trail) {
                const travelX = proj.target.x - proj.position.x;
                const travelY = proj.target.y - proj.position.y;
                trail.rotation = Math.atan2(travelY, travelX);
                const heatStacks = Math.min(
                  3,
                  Math.max(0, proj.fireClawHeatStacks ?? 0)
                );
                const baseAlpha =
                  proj.fireClawHeatStacks === undefined
                    ? 0.92
                    : 0.72 + heatStacks * 0.08;
                trail.alpha =
                  baseAlpha + Math.sin(app.ticker.lastTime * 0.018) * 0.08;
                trail.scale.y =
                  proj.fireClawHeatStacks === undefined
                    ? 1
                    : 0.75 + heatStacks * 0.12;
              }

              const psprite = container.getChildByLabel('proj_sprite') as
                | PIXI.Sprite
                | undefined;
              const shadow = container.getChildByLabel('shadow') as
                | PIXI.Graphics
                | undefined;
              if (psprite && shadow) {
                const sourceTower = engine.towers.find(
                  (t) => t.id === proj.sourceId
                );
                if (sourceTower) {
                  const baseCreature =
                    TD_CREATURE_DEFS[sourceTower.creature.speciesId]
                      .baseCreature;
                  applyTDUnitTransforms(
                    {
                      ...proj,
                      hp: 1,
                      maxHp: 1,
                      facingDirection: proj.facingDirection || 'down',
                    } as BaseTDUnit,
                    psprite,
                    shadow,
                    sourceTower.creature.speciesId,
                    baseCreature?.battleSpriteUrl || baseCreature?.spriteUrl,
                    (t) => {
                      if (!isDestroyed) psprite.texture = t;
                    }
                  );
                  if (def.dashTrailType === 'WATER') {
                    psprite.tint = 0x7dd3fc;
                  } else if (def.dashTrailType === 'FIRE') {
                    const heatStacks = Math.min(
                      3,
                      Math.max(0, proj.fireClawHeatStacks ?? 0)
                    );
                    psprite.tint =
                      proj.fireClawHeatStacks === undefined
                        ? 0xffd5a3
                        : FIRE_CLAW_DASH_TINTS[heatStacks];
                  }
                  shadow.visible = false; // Keep shadow hidden
                }
              }
            }
          }

          for (const [id, trail] of flyingColorsTrails) {
            trail.points = trail.points.filter(
              (point) => trailNow - point.time < FLYING_COLORS_TRAIL_LIFETIME_MS
            );
            if (!currentProjIds.has(id) && trail.points.length < 2) {
              airFxLayer.removeChild(trail.graphics);
              trail.graphics.destroy();
              flyingColorsTrails.delete(id);
              continue;
            }
            drawFlyingColorsTrail(
              trail.graphics,
              trail.points,
              trailNow,
              trail.color
            );
          }

          // --- Render Visual Effects ---
          const currentVfxIds = new Set(engine.visualEffects.map((v) => v.id));
          for (const [id, container] of vfxSprites.entries()) {
            if (!currentVfxIds.has(id)) {
              airFxLayer.removeChild(container);
              container.destroy({ children: true });
              vfxSprites.delete(id);
            }
          }
          for (const vfx of engine.visualEffects) {
            const existingContainer = vfxSprites.get(vfx.id);
            const container = existingContainer || new PIXI.Container();

            // Fetch the visual effect configuration
            const tdConfigMap = getDefinitionVisuals(vfx.configId) || {
              default: { scale: 1 },
            };
            const tdConfig =
              tdConfigMap[vfx.facingDirection || 'default'] ||
              tdConfigMap.default;
            const animConfig = tdConfig.vfxAnimation;

            if (!existingContainer) {
              if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
                animConfig.layers?.forEach((layer, layerIdx) => {
                  const sprite = new PIXI.Sprite();
                  sprite.label = `vfx_layer_${layerIdx}`;
                  sprite.anchor.set(layer.anchorX ?? 0.5, layer.anchorY ?? 0.5);
                  container.addChild(sprite);

                  PIXI.Assets.load(layer.url).then((t) => {
                    if (!isDestroyed) sprite.texture = t;
                  });
                });
              } else if (
                animConfig?.type === 'REVERIE_ORB' ||
                animConfig?.type === 'REVERIE_ORB_LAUNCH'
              ) {
                const pearl = new PIXI.Graphics();
                pearl.label = 'reverie_orb_vfx';
                container.addChild(pearl);
              } else if (
                animConfig?.type === 'STATIC_YIP' ||
                animConfig?.type === 'STATIC_YIP_LAUNCH' ||
                animConfig?.type === 'GRUMBLE' ||
                animConfig?.type === 'GRUMBLE_LAUNCH' ||
                animConfig?.type === 'SPARK' ||
                animConfig?.type === 'SPARK_LAUNCH'
              ) {
                const sparks = new PIXI.Graphics();
                sparks.label = 'sound_or_electric_attack_vfx';
                container.addChild(sparks);
              } else if (animConfig?.type === 'COIR_SNARE') {
                const coirVisual =
                  ATTACK_DEFS[AttackId.COIR_SNARE].projectileVisual;
                if (coirVisual?.type === 'COIR_BOLA') {
                  drawCoirSnareImpact(
                    container,
                    coirVisual.shadowColor,
                    coirVisual.fiberColor,
                    coirVisual.highlightColor,
                    coirVisual.sparkColor
                  );
                }
              } else if (animConfig?.type === 'STRING_SHOT') {
                const stringVisual =
                  ATTACK_DEFS[AttackId.STRING_SHOT].projectileVisual;
                if (stringVisual?.type === 'STRING_COIL') {
                  drawCoirSnareImpact(
                    container,
                    stringVisual.shadowColor,
                    stringVisual.fiberColor,
                    stringVisual.highlightColor,
                    stringVisual.sparkColor
                  );
                }
              } else if (
                animConfig?.type === 'SHIPSHAPE_HEAL' ||
                animConfig?.type === 'SHIPSHAPE_BRACE'
              ) {
                const repairEffect = new PIXI.Graphics();
                repairEffect.label = 'shipshape_effect';
                container.addChild(repairEffect);
              } else if (
                animConfig?.type === 'FUSE_RUSH_HIT' ||
                animConfig?.type === 'FUSE_RUSH_DETONATION'
              ) {
                const sparks = new PIXI.Graphics();
                sparks.label = 'fuse_rush_effect';
                container.addChild(sparks);
              } else if (animConfig?.type === 'RALLY_HOWL') {
                const rings = new PIXI.Graphics();
                rings.label = 'rally_howl_rings';
                container.addChild(rings);
              } else if (animConfig?.type === 'WIND_GUST') {
                drawWindGust(container);
              } else if (animConfig?.type === 'FUNNY_DANCE') {
                drawFunnyDance(container);
              } else if (animConfig?.type === 'FLYING_COLORS') {
                drawFlyingColorsImpact(container);
              } else if (animConfig?.type === 'TOXIC_POLLEN') {
                drawToxicPollen(container);
              } else if (animConfig?.type === 'SHARED_SLUMBER') {
                drawSharedSlumberCast(container);
              } else if (animConfig?.type === 'SHARED_SLUMBER_WAKE') {
                drawSharedSlumberWake(container);
              } else if (animConfig?.type === 'SHIKO_QUAKE') {
                drawShikoQuake(container);
              } else if (animConfig?.type === 'SHIKO_QUAKE_HIT') {
                const hit = new PIXI.Graphics();
                hit.label = 'shiko_stomp_hit';
                container.addChild(hit);
              } else if (animConfig?.type === 'PALM_SLAM') {
                const impact = new PIXI.Graphics();
                impact.label = 'palm_slam_impact';
                container.addChild(impact);
              } else if (animConfig?.type === 'HOWL') {
                drawHowl(container);
              } else if (animConfig?.type === 'HARDEN') {
                drawHarden(container);
              } else if (animConfig?.type === 'BARREL_BASH') {
                drawBarrelBashImpact(container);
              } else {
                const sprite = new PIXI.Sprite();
                sprite.label = 'vfx_sprite';
                sprite.anchor.set(0.5);
                container.addChild(sprite);

                const mask = new PIXI.Graphics();
                mask.label = 'vfx_mask';
                container.addChild(mask);
                sprite.mask = mask;
              }

              airFxLayer.addChild(container);
              vfxSprites.set(vfx.id, container);
            }

            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            const usesLayerOffsets = animConfig?.type === 'KEYFRAME_SPRITES';
            const effectOffsetX = usesLayerOffsets
              ? 0
              : (tdConfig.offsetX ?? 0);
            const effectOffsetY = usesLayerOffsets
              ? 0
              : (tdConfig.offsetY ?? 0);
            container.x =
              offsetX +
              (vfx.position.x / 100) * screenW +
              effectOffsetX * finalScale;
            container.y =
              offsetY +
              (vfx.position.y / 100) * screenH +
              effectOffsetY * finalScale;
            container.scale.set(finalScale);

            const progress = Math.min(1, vfx.elapsedMs / vfx.durationMs);

            if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
              animConfig.layers?.forEach((layer, layerIdx) => {
                const sprite = container.getChildByLabel(
                  `vfx_layer_${layerIdx}`
                ) as PIXI.Sprite | undefined;
                if (sprite) {
                  const baseScale = tdConfig.scale ?? 0.3;
                  const ox = tdConfig.offsetX ?? 0;
                  const oy = tdConfig.offsetY ?? 0;

                  const values = interpolateKeyframes(
                    layer.keyframes,
                    progress
                  );

                  sprite.scale.set(
                    baseScale * values.scaleX,
                    baseScale * values.scaleY
                  );
                  sprite.x = ox + values.x;
                  sprite.y = oy + values.y;
                  sprite.rotation = (values.rotation * Math.PI) / 180;
                  sprite.alpha = values.alpha;
                }
              });
            } else if (
              animConfig?.type === 'REVERIE_ORB' ||
              animConfig?.type === 'REVERIE_ORB_LAUNCH'
            ) {
              const pearl = container.getChildByLabel(
                'reverie_orb_vfx'
              ) as PIXI.Graphics;
              const palette =
                ATTACK_DEFS[AttackId.REVERIE_ORB].projectileVisual;
              if (palette?.type === 'REVERIE_ORB') {
                if (animConfig.type === 'REVERIE_ORB_LAUNCH') {
                  const sourceTower = engine.towers.find(
                    (tower) => tower.id === vfx.targetId
                  );
                  const sourceSprite = vfx.targetId
                    ? (towerSprites
                        .get(`${vfx.targetId}_${sourceTower?.creature.id}`)
                        ?.getChildByLabel('tower_sprite') as
                        | PIXI.Sprite
                        | undefined)
                    : undefined;
                  if (sourceSprite) {
                    drawReverieOrbLaunch(
                      pearl,
                      palette,
                      getDormateeOrbSocket(
                        sourceSprite,
                        vfx.facingDirection ?? 'right'
                      ),
                      progress
                    );
                  }
                } else {
                  drawReverieOrbImpact(pearl, palette, progress);
                }
              }
            } else if (
              animConfig?.type === 'STATIC_YIP' ||
              animConfig?.type === 'STATIC_YIP_LAUNCH' ||
              animConfig?.type === 'GRUMBLE' ||
              animConfig?.type === 'GRUMBLE_LAUNCH' ||
              animConfig?.type === 'SPARK' ||
              animConfig?.type === 'SPARK_LAUNCH'
            ) {
              const sparks = container.getChildByLabel(
                'sound_or_electric_attack_vfx'
              ) as PIXI.Graphics;
              const isSpark =
                animConfig.type === 'SPARK' ||
                animConfig.type === 'SPARK_LAUNCH';
              const isGrumble =
                animConfig.type === 'GRUMBLE' ||
                animConfig.type === 'GRUMBLE_LAUNCH';
              const palette =
                ATTACK_DEFS[
                  isSpark
                    ? AttackId.SPARK
                    : isGrumble
                      ? AttackId.GRUMBLE
                      : AttackId.STATIC_YIP
                ].projectileVisual;
              if (
                palette?.type === 'STATIC_YIP' ||
                palette?.type === 'SPARK' ||
                palette?.type === 'GRUMBLE'
              ) {
                if (
                  animConfig.type === 'STATIC_YIP_LAUNCH' ||
                  animConfig.type === 'GRUMBLE_LAUNCH' ||
                  animConfig.type === 'SPARK_LAUNCH'
                ) {
                  const sourceTower = engine.towers.find(
                    (tower) => tower.id === vfx.targetId
                  );
                  const sourceSprite = vfx.targetId
                    ? (towerSprites
                        .get(`${vfx.targetId}_${sourceTower?.creature.id}`)
                        ?.getChildByLabel('tower_sprite') as
                        | PIXI.Sprite
                        | undefined)
                    : undefined;
                  if (sourceSprite) {
                    const facing = vfx.facingDirection ?? 'right';
                    const sockets = getElectricAttackSockets(
                      sourceSprite,
                      facing
                    );
                    if (palette.type === 'GRUMBLE') {
                      drawGrumbleLaunch(
                        sparks,
                        palette,
                        sockets,
                        progress,
                        facing
                      );
                    } else if (isSpark) {
                      drawSparkLaunch(sparks, palette, sockets, progress);
                    } else {
                      drawStaticYipLaunch(
                        sparks,
                        palette,
                        sockets,
                        progress,
                        facing
                      );
                    }
                  }
                } else if (palette.type === 'GRUMBLE') {
                  drawGrumbleImpact(sparks, palette, progress);
                } else if (isSpark) {
                  drawSparkImpact(sparks, palette, progress);
                } else {
                  drawStaticYipImpact(sparks, palette, progress);
                }
              }
            } else if (
              animConfig?.type === 'COIR_SNARE' ||
              animConfig?.type === 'STRING_SHOT'
            ) {
              updateCoirSnareImpact(container, progress);
            } else if (
              animConfig?.type === 'SHIPSHAPE_HEAL' ||
              animConfig?.type === 'SHIPSHAPE_BRACE'
            ) {
              const repairEffect = container.getChildByLabel(
                'shipshape_effect'
              ) as PIXI.Graphics;
              if (animConfig.type === 'SHIPSHAPE_HEAL') {
                drawShipshapeHealing(repairEffect, progress);
              } else {
                drawShipshapeBrace(repairEffect, progress);
              }
            } else if (
              animConfig?.type === 'FUSE_RUSH_HIT' ||
              animConfig?.type === 'FUSE_RUSH_DETONATION'
            ) {
              drawFuseRushImpact(
                container.getChildByLabel('fuse_rush_effect') as PIXI.Graphics,
                progress,
                animConfig.type === 'FUSE_RUSH_DETONATION'
              );
            } else if (animConfig?.type === 'RALLY_HOWL') {
              drawRallyHowlRings(
                container.getChildByLabel('rally_howl_rings') as PIXI.Graphics,
                progress,
                (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 20)) / 100
              );
            } else if (animConfig?.type === 'WIND_GUST') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 20)) / 100;
              updateWindGust(container, progress, radius);
            } else if (animConfig?.type === 'FUNNY_DANCE') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 60)) / 100;
              updateFunnyDance(container, progress, radius);
            } else if (animConfig?.type === 'FLYING_COLORS') {
              updateFlyingColorsImpact(container, progress);
            } else if (animConfig?.type === 'TOXIC_POLLEN') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 20)) / 100;
              updateToxicPollen(container, progress, radius);
            } else if (animConfig?.type === 'SHARED_SLUMBER') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 40)) / 100;
              const targetOffsets = (vfx.targetIds ?? [])
                .map((targetId) =>
                  engine.enemies.find((enemy) => enemy.id === targetId)
                )
                .filter((enemy): enemy is Enemy => Boolean(enemy))
                .map((enemy) => ({
                  x:
                    (((enemy.position.x - vfx.position.x) / 100) * screenW) /
                    Math.max(finalScale, 0.001),
                  y:
                    (((enemy.position.y - vfx.position.y) / 100) * screenH) /
                    Math.max(finalScale, 0.001),
                }));
              updateSharedSlumberCast(
                container,
                progress,
                radius,
                targetOffsets
              );
            } else if (animConfig?.type === 'SHARED_SLUMBER_WAKE') {
              updateSharedSlumberWake(container, progress);
            } else if (animConfig?.type === 'SHIKO_QUAKE') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 40)) / 100;
              updateShikoQuake(container, progress, radius);
            } else if (animConfig?.type === 'SHIKO_QUAKE_HIT') {
              updateShikoStompHit(
                container.getChildByLabel('shiko_stomp_hit') as PIXI.Graphics,
                progress
              );
            } else if (animConfig?.type === 'PALM_SLAM') {
              drawPalmSlamImpact(
                container.getChildByLabel('palm_slam_impact') as PIXI.Graphics,
                progress
              );
            } else if (animConfig?.type === 'HOWL') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 11)) / 100;
              updateHowl(container, progress, radius);
            } else if (animConfig?.type === 'HARDEN') {
              updateHarden(container, progress);
            } else if (animConfig?.type === 'BARREL_BASH') {
              updateBarrelBashImpact(container, progress);
            } else {
              const sprite = container.getChildByLabel('vfx_sprite') as
                | PIXI.Sprite
                | undefined;
              const mask = container.getChildByLabel('vfx_mask') as
                | PIXI.Graphics
                | undefined;

              if (sprite) {
                applyTDUnitTransforms(
                  {
                    ...vfx,
                    hp: 1,
                    maxHp: 1,
                    facingDirection: vfx.facingDirection || 'down',
                  } as BaseTDUnit,
                  sprite,
                  new PIXI.Graphics(), // dummy shadow
                  vfx.configId,
                  undefined,
                  (t) => {
                    if (!isDestroyed) sprite.texture = t;
                  }
                );

                if (animConfig) {
                  // Handle Alpha/Fade
                  if (
                    animConfig.fadeOutProgress !== undefined &&
                    progress > animConfig.fadeOutProgress
                  ) {
                    const fadePortion = 1 - animConfig.fadeOutProgress;
                    container.alpha =
                      1 - (progress - animConfig.fadeOutProgress) / fadePortion;
                  } else {
                    container.alpha = 1;
                  }

                  // Handle Masks based on Type
                  if (mask) {
                    switch (animConfig.type) {
                      case 'WIPE_LINEAR': {
                        const size = animConfig.maskSize || 200;
                        mask.clear();
                        mask.rotation = animConfig.maskRotation || 0;
                        const wipeProgress = Math.min(1, progress * 1.5); // Finishes wiping before full duration usually
                        mask.rect(
                          -size,
                          -size,
                          size * 2,
                          size * 2 * wipeProgress
                        );
                        mask.fill(0xffffff);
                        break;
                      }
                      case 'FADE':
                      case 'SCALE':
                      case 'CUSTOM':
                      default: {
                        const size = 500;
                        mask.clear();
                        mask.rect(-size, -size, size * 2, size * 2);
                        mask.fill(0xffffff);
                        break;
                      }
                    }
                  }
                } else {
                  // Default fallback if no config
                  container.alpha =
                    progress > 0.8 ? 1 - (progress - 0.8) * 5 : 1;
                  if (mask) {
                    const size = 500;
                    mask.clear();
                    mask.rect(-size, -size, size * 2, size * 2);
                    mask.fill(0xffffff);
                  }
                }
              }
            }
          }

          // --- Render food tossed from Mari to towers in the recovery area ---
          const currentRecoveryFeedIds = new Set(
            engine.towerRecoveryFeeds.map((feed) => feed.id)
          );
          for (const [id, container] of recoveryFeedSprites.entries()) {
            if (!currentRecoveryFeedIds.has(id)) {
              airFxLayer.removeChild(container);
              container.destroy({ children: true });
              recoveryFeedSprites.delete(id);
            }
          }
          for (const feed of engine.towerRecoveryFeeds) {
            let container = recoveryFeedSprites.get(feed.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none';

              const fruit = new PIXI.Graphics();
              fruit.circle(0, 0, 10);
              fruit.fill({ color: 0xf97316, alpha: 1 });
              fruit.stroke({ color: 0x7c2d12, alpha: 1, width: 2 });
              fruit.ellipse(5, -10, 5, 2.5);
              fruit.fill({ color: 0x65a30d, alpha: 1 });
              container.addChild(fruit);

              airFxLayer.addChild(container);
              recoveryFeedSprites.set(feed.id, container);
            }

            const travelDuration = Math.max(
              1,
              feed.impactAtMs - feed.startedAtMs
            );
            const progress = Math.max(
              0,
              Math.min(
                1,
                (engine.elapsedTimeMs - feed.startedAtMs) / travelDuration
              )
            );
            const sourceX = offsetX + (feed.sourcePosition.x / 100) * screenW;
            const sourceY = offsetY + (feed.sourcePosition.y / 100) * screenH;
            const targetX = offsetX + (feed.targetPosition.x / 100) * screenW;
            const targetY = offsetY + (feed.targetPosition.y / 100) * screenH;
            const eased = 1 - (1 - progress) ** 2;

            container.x = sourceX + (targetX - sourceX) * eased;
            container.y =
              sourceY +
              (targetY - sourceY) * eased -
              Math.sin(progress * Math.PI) * viewportH * 0.07 * zoom;
            container.rotation = progress * Math.PI * 2;
            container.scale.set(Math.max(0.45, zoom));
            container.alpha =
              feed.impactedAtMs === undefined
                ? 1
                : Math.max(
                    0,
                    1 -
                      (engine.elapsedTimeMs - feed.impactedAtMs) /
                        Math.max(1, feed.expiresAtMs - feed.impactedAtMs)
                  );
          }

          // --- Render Floating Texts ---
          const currentFtIds = new Set(engine.floatingTexts.map((ft) => ft.id));
          for (const [id, textObj] of floatingTextSprites.entries()) {
            if (!currentFtIds.has(id)) {
              hudLayer.removeChild(textObj);
              textObj.destroy();
              floatingTextSprites.delete(id);
            }
          }
          for (const ft of engine.floatingTexts) {
            let textObj = floatingTextSprites.get(ft.id);
            if (!textObj) {
              textObj = new PIXI.Text({
                text: ft.text,
                style: {
                  fontFamily: 'monospace',
                  fontSize: Math.max(16, viewportH * 0.02) * (ft.scale ?? 1),
                  fontWeight: 'bold',
                  fill: ft.color ?? 0xffffff,
                  stroke: { color: 0x000000, width: 3 },
                },
              });
              textObj.anchor.set(0.5);
              hudLayer.addChild(textObj);

              // Render on top
              hudLayer.setChildIndex(textObj, hudLayer.children.length - 1);

              floatingTextSprites.set(ft.id, textObj);
            }

            const progress = ft.elapsedMs / ft.durationMs;

            textObj.x = offsetX + (ft.position.x / 100) * screenW;
            // Float up calculation: start at position, go up by up to 5% of screen height
            textObj.y =
              offsetY +
              (ft.position.y / 100) * screenH -
              progress * screenH * 0.05 -
              screenH * 0.02;
            textObj.scale.set(zoom);
            textObj.alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
          }
        });
      };

      initPixi();

      return () => {
        isDestroyed = true;
        removePointerListeners?.();
        if (dragPointerRef.current?.source === 'internal')
          onDragStateChangeRef.current?.(false);
        dragPointerRef.current = null;
        dragPosRef.current = null;
        edgeScrollStateRef.current = createTDDragEdgeScrollState();
        isOpeningPanActiveRef.current = false;
        if (isInitialized) {
          app.destroy(true, { children: true });
        }
      };
    }, [
      engine,
      backgroundScale,
      backgroundUrl,
      fitToScreen,
      initialView,
      openingPan,
      dragSurfaceRef,
    ]);

    return (
      <div className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />
        <div
          ref={fpsRef}
          className={`pointer-events-none absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-1 font-mono text-sm font-bold text-green-400 shadow select-none ${
            hideUi ? 'invisible' : ''
          }`}
        >
          FPS: 0
        </div>

        {/* Zoom Controls */}
        {backgroundScale > 1 && !hideUi && (
          <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1">
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white transition-colors select-none hover:bg-black/80"
              onClick={() => {
                zoomRef.current = Math.min(1, zoomRef.current + 0.1);
              }}
            >
              +
            </button>
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white transition-colors select-none hover:bg-black/80"
              onClick={() => {
                const minZoom = 1 / backgroundScale;
                zoomRef.current = Math.max(minZoom, zoomRef.current - 0.1);
              }}
            >
              −
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default PixiBattlefield;
