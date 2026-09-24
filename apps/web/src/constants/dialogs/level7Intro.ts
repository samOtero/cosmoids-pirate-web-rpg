import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_7_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'The morning after escaping Ironbell, Caleb’s little boat creeps along with its new crew packed shoulder to shoulder.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'Mopup and I are sharing one seat. Tigrevel is sharing… the rest of the boat.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'I’m so cramped in this tiny boat, I found us an island where we can stretch our legs. There’s a sheltered cove just ahead!',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'The moment the bow touches sand, Tigrevel bounds ashore. The boat rises with a grateful creak.',
      backgroundImageKey: BackgroundImageKey.LEVEL_7_LANDFALL,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'A wild island? There could be Cosmoids here we’ve never seen before! Come on—let’s explore!',
      backgroundImageKey: BackgroundImageKey.LEVEL_7_LANDFALL,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_6_CRAMPED_CREW_DEPARTURE,
};
