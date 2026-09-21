import { SpeakerImageKey, BackgroundImageKey } from '@/types/baseGame';

export const MAX_PROFILES = 3;
export const CURRENT_PROFILE_VERSION = 9;
export const MAX_COSMOID_LEVEL = 16;
export const MAX_PARTY_SIZE = 6;

// The reference viewport height used for calculating responsive scale of TD units
export const TD_BASE_HEIGHT = 600;

export const SPEAKER_IMAGES: Record<SpeakerImageKey, string> = {
  [SpeakerImageKey.GUIDE]:
    '/dialog/dialog_caleb_neutral_starter_outfit_small.webp',
  [SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT]:
    '/dialog_grandpa_neutral_starter_outfit.webp',
  [SpeakerImageKey.GRANDPA_SURPRISED_STARTER_OUTFIT]:
    '/dialog_grandpa_surprised_starter_outfit.webp',
  [SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_neutral_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT]:
    '/dialog_caleb_yawn_starter_outfit.webp',
  [SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_happy_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT]:
    '/dialog_caleb_disappointed_starter_outfit.webp',
  [SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_scared_surprised_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_ANGRY_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_angry_starter_outfit_clean.webp',
  [SpeakerImageKey.CALEB_ANNOYED_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_annoyed_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_confident_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_FLUSTERED_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_flustered_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_SCARED_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_scared_starter_outfit_small.webp',
  [SpeakerImageKey.CALEB_SHIPWRECKED_DAZED_STARTER_OUTFIT]:
    '/dialog/dialog_caleb_shipwrecked_dazed.webp',
  [SpeakerImageKey.HOOKAW_TIRED_DIVE_SKIN_1]:
    '/dialog_parrot_tired_dive_skin_1.webp',
  [SpeakerImageKey.HOOKAW_TIRED_SKIN_1]: '/dialog_parrot_tired_skin_1-v1.webp',
  [SpeakerImageKey.STARTER_CHEST_CLOSED]: '/starter_box.png',
  [SpeakerImageKey.STARTER_CHEST_OPEN]: '/starter_box_opened.png',
  [SpeakerImageKey.STARTER_1_CRAB]: '/crab-starter-grass-neutral-skin-1.png',
  [SpeakerImageKey.STARTER_2_IGUANA]: '/iguana_starter_fire_neutral_skin_1.png',
  [SpeakerImageKey.STARTER_3_MONKEY]:
    '/monkey_starter_water_neutral_skin_1.png',
  [SpeakerImageKey.MOPUP]: '/UI/Icons/mopup_icon.png',
  [SpeakerImageKey.EEL_SENTICLE]: '/dialog/senticle_dark_aura_small.webp',
  [SpeakerImageKey.CREWMATE]: 'https://picsum.photos/seed/crewmate_npc/300/300',
  [SpeakerImageKey.OLD_SAILOR]: 'https://picsum.photos/seed/oldsailor/300/300',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK]: '/dialog_pirate_grunt_smirk.webp',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY]:
    '/dialog_pirate_grunt_aggressive.webp',
  [SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING]:
    '/dialog_pirate_grunt_aggressive_point.webp',
  [SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1]: '/dialog/lance_portrait_actual.webp',
  [SpeakerImageKey.LANCE_AMUSED]: '/dialog/lance_amused_small.webp',
  [SpeakerImageKey.LANCE_ANGRY]: '/dialog/lance_angry_small.webp',
  [SpeakerImageKey.LANCE_CALM]: '/dialog/lance_calm_small.webp',
  [SpeakerImageKey.LANCE_SERIOUS]: '/dialog/lance_serious_small.webp',
  [SpeakerImageKey.LANCE_SMILING]: '/dialog/lance_smiling_small.webp',
  [SpeakerImageKey.LANCE_SURPRISED]: '/dialog/lance_surprised_small.webp',
  [SpeakerImageKey.KIP_NERVOUS_NEUTRAL]: '/dialog/kip_nervous_neutral.webp',
  [SpeakerImageKey.KIP_PANICKED]: '/dialog/kip_panicked.webp',
  [SpeakerImageKey.KIP_WORRIED]: '/dialog/kip_worried.webp',
  [SpeakerImageKey.KIP_DETERMINED]: '/dialog/kip_determined.webp',
  [SpeakerImageKey.KIP_HOPEFUL_SURPRISED]: '/dialog/kip_hopeful_surprised.webp',
  [SpeakerImageKey.KIP_RELIEVED_HAPPY]: '/dialog/kip_relieved_happy.webp',
  [SpeakerImageKey.MARIBEL_NEUTRAL_WARY]: '/dialog/maribel_neutral_wary.webp',
  [SpeakerImageKey.MARIBEL_WORRIED]: '/dialog/maribel_worried.webp',
  [SpeakerImageKey.MARIBEL_STARTLED]: '/dialog/maribel_startled.webp',
  [SpeakerImageKey.MARIBEL_DETERMINED]: '/dialog/maribel_determined.webp',
  [SpeakerImageKey.MARIBEL_ANGRY_DEFENSIVE]:
    '/dialog/maribel_angry_defensive.webp',
  [SpeakerImageKey.MARIBEL_RELIEVED_HAPPY]:
    '/dialog/maribel_relieved_happy.webp',
  [SpeakerImageKey.TIGREVEL]: '/UI/Icons/tigrevel_icon.png',
  [SpeakerImageKey.VOLTUSK_WARNING]: '/dialog/voltusk_warning.webp',
  [SpeakerImageKey.VOLTUSK_CURSED_WARNING]:
    '/dialog/voltusk_cursed_warning.webp',
  [SpeakerImageKey.NAVY_GUARD_ALERT]: '/dialog/navy_guard_alert.webp',
  [SpeakerImageKey.NAVY_COMMANDER_NEUTRAL]:
    '/dialog/navy_commander_neutral.webp',
  [SpeakerImageKey.NAVY_COMMANDER_DESPERATE_SHOUT]:
    '/dialog/navy_commander_desperate_shout.webp',
  [SpeakerImageKey.NAVY_COMMANDER_SHOCKED_DEFEAT]:
    '/dialog/navy_commander_shocked_defeat.webp',
  [SpeakerImageKey.CAPTAIN_VANE_HAUGHTY_NEUTRAL]:
    '/dialog/captain_vane_haughty_neutral.webp',
  [SpeakerImageKey.CAPTAIN_VANE_MOCKING_DISBELIEF]:
    '/dialog/captain_vane_mocking_disbelief.webp',
  [SpeakerImageKey.CAPTAIN_VANE_COMMANDING_ANGRY]:
    '/dialog/captain_vane_commanding_angry.webp',
  [SpeakerImageKey.CAPTAIN_VANE_SMUG_AMUSED]:
    '/dialog/captain_vane_smug_amused.webp',
  [SpeakerImageKey.CAPTAIN_VANE_STUNNED_DEFEAT]:
    '/dialog/captain_vane_stunned_defeat.webp',
  [SpeakerImageKey.BEETADEL_STERN]: '/dialog/beetadel_stern.webp',
  [SpeakerImageKey.RAT_CATCHER_1]: '/dialog/rat_catcher_1.webp',
  [SpeakerImageKey.RAT_CATCHER_ANGRY]: '/dialog/rat_catcher_angry_small.webp',
  [SpeakerImageKey.RAT_CATCHER_CALM]: '/dialog/rat_catcher_calm.webp',
  [SpeakerImageKey.RAT_CATCHER_COCKY]: '/dialog/rat_catcher_cocky_small.webp',
  [SpeakerImageKey.RAT_CATCHER_MOCKING]:
    '/dialog/rat_catcher_mocking_small.webp',
  [SpeakerImageKey.RAT_CATCHER_SMUG]: '/dialog/rat_catcher_smug_small.webp',
  [SpeakerImageKey.ASTROLAPE]: '/dialog/astrolape_neutral.webp',
  [SpeakerImageKey.ASTROLAPE_ROAR]: '/dialog/astrolape_roar.webp',
  [SpeakerImageKey.NARRATOR]:
    'https://picsum.photos/seed/narrator_book/300/300',
  [SpeakerImageKey.DEFAULT]: 'https://picsum.photos/seed/unknown_npc/300/300',
  [SpeakerImageKey.EMPTY]: '',
};

export const BACKGROUND_IMAGES: Record<BackgroundImageKey, string> = {
  [BackgroundImageKey.CALEB_HOUSE]: '/bg_caleb_house_1.webp',
  [BackgroundImageKey.FIRST_TOWN_DOCKS]: '/bg_first_town_docks_1.webp',
  [BackgroundImageKey.ISLAND_1]: '/island_1_wip.webp',
  [BackgroundImageKey.FOREST]: '/battles/bg/bg_first_island_forest_battle.png',
  [BackgroundImageKey.FOREST_2]:
    '/battles/bg/bg_first_island_forest_battle_2.png',
  [BackgroundImageKey.DOCK_PIXEL]: '/battles/bg/bg_dock_battle_pixel.png',
  [BackgroundImageKey.LEVEL_2_STORMY_SEA]: '/bg_level_2_stormy_sea.webp',
  [BackgroundImageKey.LEVEL_2_WAVE_IMPACT]: '/bg_level_2_wave_impact.webp',
  [BackgroundImageKey.LEVEL_2_SHIPWRECK_BEACH]:
    '/bg_level_2_shipwreck_beach.webp',
  [BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES]:
    '/bg_level_2_repaired_boat_supplies.webp',
  [BackgroundImageKey.LEVEL_3_SAILING_AWAY]: '/bg_level_3_sailing_away.webp',
  [BackgroundImageKey.LEVEL_4_VANE_CHASE]: '/bg_level_4_vane_chase.webp',
  [BackgroundImageKey.LEVEL_4_IRONBELL_HARBOR]:
    '/bg_level_4_ironbell_harbor.webp',
  [BackgroundImageKey.LEVEL_4_IRONBELL_MARKET]:
    '/bg_level_4_ironbell_market.webp',
  [BackgroundImageKey.LEVEL_4_IRONBELL_CELL]: '/bg_level_4_ironbell_cell.webp',
  [BackgroundImageKey.LEVEL_5_IRONBELL_UNDERCROFT]:
    '/bg_level_5_ironbell_undercroft.webp',
  [BackgroundImageKey.LEVEL_5_MEMORY_BEACH]: '/bg_level_5_memory_beach.webp',
  [BackgroundImageKey.LEVEL_5_MEMORY_RAZHOUND_ATTACK]:
    '/bg_level_5_memory_razhound_attack.webp',
  [BackgroundImageKey.LEVEL_5_MEMORY_TIGREVEL_RESCUE]:
    '/bg_level_5_memory_tigrevel_rescue.webp',
  [BackgroundImageKey.LEVEL_5_MEMORY_NAVY_CAPTURE]:
    '/bg_level_5_memory_navy_capture.webp',
  [BackgroundImageKey.LEVEL_5_TIGREVEL_CELL]: '/bg_level_5_tigrevel_cell.webp',
  [BackgroundImageKey.LEVEL_5_TIGREVEL_FREED]: '/bg_level_5_tigrevel_freed.webp',
  [BackgroundImageKey.LEVEL_5_TIGREVEL_PROTECTS_KIDS]:
    '/bg_level_5_tigrevel_protects_kids.webp',
  [BackgroundImageKey.LEVEL_6_NET_THROW]: '/bg_level_6_net_throw.webp',
  [BackgroundImageKey.LEVEL_6_TIGREVEL_NETTED]:
    '/bg_level_6_tigrevel_netted.webp',
  [BackgroundImageKey.LEVEL_6_TIGREVEL_CLAIMS_BOAT]:
    '/bg_level_6_tigrevel_claims_boat.webp',
  [BackgroundImageKey.LEVEL_6_CRAMPED_CREW_DEPARTURE]:
    '/bg_level_6_cramped_crew_departure.webp',
  [BackgroundImageKey.DEFAULT]: '/bg_caleb_house_1.webp',
};
