import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_4_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: '???',
          flipped: true,
        },
      ],
      text: "Thank you! I'm Mari. I couldn't have made it without you.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
        },
      ],
      text: "I'm Kip. Are you hurt?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "I'm fine! And look, the food's still safe!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Food?! That's what you were protecting? Who's it for?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "A wild Cosmoid. The Navy keeps it locked beneath Ironbell. They say it's too dangerous to release.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'They stopped feeding it, so I bring it every meal.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Dangerous or not, they can’t just let it starve! Lead the way!',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Far below the market, an iron bowl scrapes across stone.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_CELL,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Behind the bars, a striped head rises. Golden eyes fix on the approaching footsteps.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_CELL,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
};
