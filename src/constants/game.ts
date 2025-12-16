import { Island, SpeakerImageKey, BackgroundImageKey } from "@/types/baseGame";

export const MAX_PROFILES = 3;

export const ISLANDS: Island[] = [
  {
    id: 0,
    name: "Home Shore",
    description: "A peaceful starting beach.",
    difficulty: 1,
    coordinates: { x: 10, y: 80 },
    unlocked: true,
    cleared: false,
  },
  {
    id: 1,
    name: "Coral Reef",
    description: "Vibrant colors hide lurking dangers.",
    difficulty: 2,
    coordinates: { x: 30, y: 60 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 2,
    name: "Stormy Atoll",
    description: "Constant rain strengthens water types.",
    difficulty: 3,
    coordinates: { x: 50, y: 40 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 3,
    name: "Volcanic Crag",
    description: "Intense heat and tough enemies.",
    difficulty: 4,
    coordinates: { x: 70, y: 20 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 4,
    name: "Abyssal Point",
    description: "The edge of the known world.",
    difficulty: 5,
    coordinates: { x: 90, y: 50 },
    unlocked: false,
    cleared: false,
  },
];

export const SPEAKER_IMAGES: Record<SpeakerImageKey, string> = {
  [SpeakerImageKey.GUIDE]: "/dialog_caleb_neutral_starter_outfit.png",
  [SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT]:
    "/dialog_grandpa_neutral_starter_outfit.png",
  [SpeakerImageKey.GRANDPA_SURPRISED_STARTER_OUTFIT]:
    "/dialog_grandpa_surprised_starter_outfit.png",
  [SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT]:
    "/dialog_caleb_neutral_starter_outfit.png",
  [SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT]:
    "/dialog_caleb_yawn_starter_outfit.png",
  [SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT]:
    "/dialog_caleb_happy_starter_outfit.png",
  [SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT]:
    "/dialog_caleb_disappointed_starter_outfit.png",
  [SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT]:
    "/dialog_caleb_scared_surprised_starter_outfit.png",
  [SpeakerImageKey.HOOKAW_TIRED_BOX_DIVE_SKIN_1]:
    "/dialog_parrot_tired_box_dive_skin_1.png",
  [SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1]:
    "/dialog_parrot_tired_box_skin_1.png",
  [SpeakerImageKey.HOOKAW_TIRED_SKIN_1]: "/dialog_parrot_tired_skin_1-v1.png",
  [SpeakerImageKey.STARTER_CHEST_CLOSED]: "/starter_box.png",
  [SpeakerImageKey.STARTER_CHEST_OPEN]: "/starter_box_opened.png",
  [SpeakerImageKey.STARTER_1_CRAB]: "/crab-starter-grass-neutral-skin-1.png",
  [SpeakerImageKey.STARTER_2_IGUANA]: "/iguana_starter_fire_neutral_skin_1.png",
  [SpeakerImageKey.STARTER_3_MONKEY]:
    "/monkey_starter_water_neutral_skin_1.png",
  [SpeakerImageKey.CREWMATE]: "https://picsum.photos/seed/crewmate_npc/300/300",
  [SpeakerImageKey.OLD_SAILOR]: "https://picsum.photos/seed/oldsailor/300/300",
  [SpeakerImageKey.NARRATOR]:
    "https://picsum.photos/seed/narrator_book/300/300",
  [SpeakerImageKey.DEFAULT]: "https://picsum.photos/seed/unknown_npc/300/300",
  [SpeakerImageKey.EMPTY]: "",
};

export const BACKGROUND_IMAGES: Record<BackgroundImageKey, string> = {
  [BackgroundImageKey.CALEB_HOUSE]: "/bg_caleb_house_1.png",
  [BackgroundImageKey.FIRST_TOWN_DOCKS]: "/bg_first_town_docks_1.png",
  [BackgroundImageKey.DEFAULT]: "/bg_caleb_house_1.png",
};

