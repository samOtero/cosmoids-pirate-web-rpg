import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_6_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Navy Commander',
          flipped: true,
        },
      ],
      text: 'No... My Voltusk—defeated? By a band of children?!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: 'Maybe we should run before he stops being stunned!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Outside Ironbell, Caleb holds out a capture doubloon.',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Tigrevel, want to join my crew?',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Tigrevel walks straight past the doubloon, leaps aboard the little boat, and nearly tips it sideways.',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
        },
      ],
      text: 'I think we just joined Tigrevel’s crew. And... this might be Tigrevel’s boat now.',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Works for me! Mari, why don’t you come with us too?',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_STARTLED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'M-Me? You really want me on your crew?',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Tigrevel used to be my only friend. But now... I think I have more. So yes,I’m coming!',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'A few moments later..',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_CRAMPED_CREW_DEPARTURE,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'As your new navigator, my first advice is... We need a bigger boat.',
      backgroundImageKey: BackgroundImageKey.LEVEL_6_CRAMPED_CREW_DEPARTURE,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT,
};
