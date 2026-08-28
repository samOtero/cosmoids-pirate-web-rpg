import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_5_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Mari leads Caleb and Kip through the dripping passages beneath Ironbell.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'So what kind of Cosmoid needs a fortress for a cage?',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_NEUTRAL_WARY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'A Tigrevel. I first saw it sitting alone on the eastern beach.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_MEMORY_BEACH,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Then the Razhounds came after me. I tripped, and they surrounded me.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_MEMORY_RAZHOUND_ATTACK,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'The tiger charged between us. It drove the entire pack away.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_MEMORY_TIGREVEL_RESCUE,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_ANGRY_DEFENSIVE,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'It never hurt me. But the commander called it dangerous and had his officers drag it beneath Ironbell.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_MEMORY_NAVY_CAPTURE,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Mari raises her lantern. Behind the iron bars, two golden eyes open.',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: 'M-Mari... you forgot to mention that it was enormous!',
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "It's incredible! Once we open those bars, I'm going to catch it!",
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_GUARD_ALERT,
          displayName: 'Navy Guard',
        },
      ],
      text: "Who's down there? Step away from that prisoner!",
      backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT,
};
