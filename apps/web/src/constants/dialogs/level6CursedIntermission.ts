import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_6_CURSED_INTERMISSION: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Commander Strake',
          flipped: true,
        },
      ],
      text: 'Enough. I will not be humiliated by a band of children.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_DESPERATE_SHOUT,
          displayName: 'Commander Strake',
          flipped: true,
        },
      ],
      text: 'In war, victory is all that matters, no matter the cost.',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'A violent violet flare erupts around Voltusk.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.VOLTUSK_CURSED_WARNING,
          displayName: 'Voltusk',
        },
      ],
      text: 'BWOOOOARGH!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: 'That aura... He’s forcing the curse into Voltusk!',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT,
};
