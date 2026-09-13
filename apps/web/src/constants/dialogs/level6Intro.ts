import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_6_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Commander Strake... He’s the one who ordered Tigrevel dragged beneath Ironbell.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Commander Strake',
          flipped: true,
        },
      ],
      text: 'So.. you refuse to return willingly. Very well. You’ll be dragged back by force.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Tigrevel lunges. The commander snaps open a steel net and casts it over Tigrevel mid-leap.',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_NET_THROW,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_STARTLED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Tigrevel!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Commander Strake',
          flipped: true,
        },
      ],
      text: 'Voltusk. Return the prisoner. Anyone in your way goes with it.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.VOLTUSK_WARNING,
          displayName: 'Voltusk',
        },
      ],
      text: 'BWOOOONG!',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Voltusk advances with electricity flickering between its steel tusks. A squad of Poguin seizes the net’s hauling lines.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_DETERMINED,
          displayName: 'Kip',
        },
      ],
      text: 'I-I’m scared… but Tigrevel stood between us and him. So I’m standing here.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'You heard him! Nobody takes Tigrevel back!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Then let’s show this commander what happens when he threatens our crew.',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_NETTED,
};
