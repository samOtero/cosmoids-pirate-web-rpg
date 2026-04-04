import { SpeakerImageKey, BackgroundImageKey } from '@/types/baseGame';

export const MAX_PROFILES = 3;
export const CURRENT_PROFILE_VERSION = 4;

export { ISLANDS } from './islands';

export const SPEAKER_IMAGES: Record<SpeakerImageKey, string> = {
  [SpeakerImageKey.GUIDE]: '/dialog_caleb_neutral_starter_outfit.png',
  [SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT]:
    '/dialog_grandpa_neutral_starter_outfit.png',
  [SpeakerImageKey.GRANDPA_SURPRISED_STARTER_OUTFIT]:
    '/dialog_grandpa_surprised_starter_outfit.png',
  [SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT]:
    '/dialog_caleb_neutral_starter_outfit.png',
  [SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT]:
    '/dialog_caleb_yawn_starter_outfit.png',
  [SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT]:
    '/dialog_caleb_happy_starter_outfit.png',
  [SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT]:
    '/dialog_caleb_disappointed_starter_outfit.png',
  [SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT]:
    '/dialog_caleb_scared_surprised_starter_outfit.png',
  [SpeakerImageKey.HOOKAW_TIRED_DIVE_SKIN_1]:
    '/dialog_parrot_tired_dive_skin_1.png',
  [SpeakerImageKey.HOOKAW_TIRED_SKIN_1]: '/dialog_parrot_tired_skin_1-v1.png',
  [SpeakerImageKey.STARTER_CHEST_CLOSED]: '/starter_box.png',
  [SpeakerImageKey.STARTER_CHEST_OPEN]: '/starter_box_opened.png',
  [SpeakerImageKey.STARTER_1_CRAB]: '/crab-starter-grass-neutral-skin-1.png',
  [SpeakerImageKey.STARTER_2_IGUANA]: '/iguana_starter_fire_neutral_skin_1.png',
  [SpeakerImageKey.STARTER_3_MONKEY]:
    '/monkey_starter_water_neutral_skin_1.png',
  [SpeakerImageKey.EEL_SENTICLE]: '/eel-basic-normal-neutral-skin-1.png',
  [SpeakerImageKey.CREWMATE]: 'https://picsum.photos/seed/crewmate_npc/300/300',
  [SpeakerImageKey.OLD_SAILOR]: 'https://picsum.photos/seed/oldsailor/300/300',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK]: '/dialog_pirate_grunt_smirk.png',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY]:
    '/dialog_pirate_grunt_aggressive.png',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING]:
    '/dialog_pirate_grunt_aggressive_point.png',
  [SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1]:
    '/dialog/lance_neutral_outfit_1.png',
  [SpeakerImageKey.NARRATOR]:
    'https://picsum.photos/seed/narrator_book/300/300',
  [SpeakerImageKey.DEFAULT]: 'https://picsum.photos/seed/unknown_npc/300/300',
  [SpeakerImageKey.EMPTY]: '',
};

export const BACKGROUND_IMAGES: Record<BackgroundImageKey, string> = {
  [BackgroundImageKey.CALEB_HOUSE]: '/bg_caleb_house_1.png',
  [BackgroundImageKey.FIRST_TOWN_DOCKS]: '/bg_first_town_docks_1.png',
  [BackgroundImageKey.ISLAND_1]: '/island_1_wip.png',
  [BackgroundImageKey.FOREST]: '/battles/bg/bg_first_island_forest_battle.png',
  [BackgroundImageKey.FOREST_2]:
    '/battles/bg/bg_first_island_forest_battle_2.png',
  [BackgroundImageKey.DOCK_PIXEL]: '/battles/bg/bg_dock_battle_pixel.png',
  [BackgroundImageKey.DEFAULT]: '/bg_caleb_house_1.png',
};

export const BATTLE_BACKGROUND_IMAGES: Record<BackgroundImageKey, string> = {
  ...BACKGROUND_IMAGES,
  [BackgroundImageKey.FIRST_TOWN_DOCKS]:
    '/battles/bg/bg_first_town_docks_1_battle_2.png',
  [BackgroundImageKey.FOREST]: '/battles/bg/bg_first_island_forest_battle.png',
  [BackgroundImageKey.FOREST_2]:
    '/battles/bg/bg_first_island_forest_battle_2.png',
  [BackgroundImageKey.DOCK_PIXEL]: '/battles/bg/bg_dock_battle_pixel.png',
};
