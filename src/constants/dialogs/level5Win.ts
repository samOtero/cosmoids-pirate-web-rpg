import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_5_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'The final iron bar splits with a deafening crack. Tigrevel steps out of the cell and stretches its stone-hard claws.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "You're free! I knew we'd get you out!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Now run! Get out before more Navy officers come!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Tigrevel looks toward the open passage. Then it turns back and plants itself between the children and the approaching footsteps.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_HOPEFUL_SURPRISED,
          displayName: 'Kip',
        },
      ],
      text: "It could escape... but it's staying to protect us.",
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Then we stand together!',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Navy Commander',
          flipped: true,
        },
      ],
      text: 'Touching. But no one leaves my fortress without my order.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_FREED,
};
