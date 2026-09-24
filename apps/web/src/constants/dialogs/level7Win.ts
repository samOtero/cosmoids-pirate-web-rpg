import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_7_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'When the crew is ready, they gather on the beach beside their very crowded little boat.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'That was relaxing. Until I remembered we all have to fit back in there.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Then our next stop has to be somewhere we can find a bigger boat.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_HOPEFUL_SURPRISED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'Wait! Captain Vane used to visit an island near here. She said its harbor was filled with ships of every shape and size.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'I know the island. With this wind, I can get us there by tomorrow.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Then set a course! Our bigger boat is waiting!',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_7_DEPARTURE,
};
