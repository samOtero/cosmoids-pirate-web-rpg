import { UnitVisuals } from '@/types/baseGame';

export const CREATURE_TD_CONFIGS: Record<string, UnitVisuals> = {
  senticle: {
    default: {
      scale: 0.35,
    },
  },
  bug_stage_1: {
    default: {
      scale: 0.5,
    },
  },
  bug_stage_2: {
    default: {
      scale: 0.15,
      shadowScaleX: 1.2,
      shadowOffsetY: 52,
      flipX: true,
    },
    left: {
      scale: 0.15,
      shadowScaleX: 1.2,
      shadowOffsetY: 52,
      flipX: false,
    },
    right: {
      scale: 0.15,
      shadowScaleX: 1.2,
      shadowOffsetY: 52,
      flipX: true,
    },
  },
  bug_stage_3: {
    default: {
      scale: 0.17,
      flipX: true,
    },
    left: {
      flipX: false,
    },
    right: {
      flipX: true,
    },
  },
  starter_crab: {
    default: {
      scale: 0.47,
      shadowScaleX: 1.25,
      shadowOffsetX: 5,
      shadowOffsetY: 6,
    },
    left: {
      scale: 0.47,
      shadowScaleX: 1.25,
      shadowOffsetX: 5,
      shadowOffsetY: 6,
      flipX: false,
    },
    right: {
      scale: 0.47,
      shadowScaleX: 1.25,
      shadowOffsetX: 5,
      shadowOffsetY: 6,
      flipX: true,
    },
    up: {
      url: '/battles/cosmoids/palmit_up_1.png',
      scale: 0.47,
      offsetY: -3,
      shadowOffsetY: 8,
      shadowScaleX: 1.3,
    },
  },
  starter_iguana: {
    default: {
      scale: 0.65,
      shadowScaleX: 1.9,
      shadowScaleY: 0.6,
      shadowOffsetX: -7,
      shadowOffsetY: 7,
    },
    left: {
      scale: 0.65,
      shadowScaleX: 1.9,
      shadowScaleY: 0.6,
      shadowOffsetX: -7,
      shadowOffsetY: 7,
      flipX: false,
    },
    right: {
      scale: 0.65,
      shadowScaleX: 1.9,
      shadowScaleY: 0.6,
      shadowOffsetX: -7,
      shadowOffsetY: 7,
      flipX: true,
    },
    up: {
      url: '/battles/cosmoids/fueguana_up_1_v3.png',
      scale: 0.65,
      offsetX: -11,
      shadowOffsetY: 5,
      shadowScaleX: 1.15,
    },
    down: {
      url: '/battles/cosmoids/fueguana_down_1_v3.png',
      scale: 0.65,
      shadowOffsetX: -3,
      offsetX: 10,
      shadowOffsetY: 5,
    },
  },
  starter_monkey: {
    default: {
      scale: 0.29,
      shadowScaleX: 1.4,
      shadowOffsetX: -2,
      shadowOffsetY: 26,
    },
    left: {
      scale: 0.29,
      shadowScaleX: 1.4,
      shadowOffsetX: -2,
      shadowOffsetY: 26,
      flipX: false,
    },
    right: {
      scale: 0.29,
      shadowScaleX: 1.4,
      shadowOffsetX: -2,
      shadowOffsetY: 26,
      flipX: true,
    },
  },
};
