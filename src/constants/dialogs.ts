import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
  DialogContext,
} from "@/types/baseGame";

export const NEW_PLAYER_WELCOME_DIALOG: DialogConfig = {
  sequence: [
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "One sunny morning in the small coastal town of Seabreeze...",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Caleb! Wake up, you sleepy sea-pup!",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "You can't sleep through your own birthday. Not when the Horizon Chaser is due in port any minute!",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
      text: "*Yawn* The Horizon Chaser...?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "Mom! Dad! Did they sound the horn?! Did I miss them docking?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Easy now! No horn yet. Go wash your face in the basin, then meet me at the docks. I'll keep an eye out for your folks.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "And fix that mop on your head! You look like a castaway.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "I'm on my way! I can't wait to see what new Cosmoids they brought back!",
      displayName: "Caleb",
    },
  ],
  backgroundImageKey: BackgroundImageKey.CALEB_HOUSE,
  next: {
    screen: Screens.DIALOG,
    context: DialogContext.GAME_INTRO_PART_2,
    contextData: { islandId: 0 },
  },
};

export const NEW_PLAYER_WELCOME_DIALOG_PART_2: DialogConfig = {
  sequence: [
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "A few minutes later, at the docks...",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "Grandpa! Do you see them?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Hmmph. That's strange. The winds are fair, and your father is never late for a celebration cake...",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT,
      text: "They aren't coming, are they...?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Now, don't say that...",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT,
      text: 'They said they\'d be here by sunrise. "For sure this time," Dad said in the letter. I guess... I guess finding that Legendary Island was more important than...',
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Don't talk like that, lad. They're probably just chasing a rare Cosmoid. You know how your father gets when he sees something shiny.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "Suddenly, a high-pitched screech is heard from the sky.",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Grandpa! Watch out! It's coming straight at you!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_BOX_DIVE_SKIN_1,
      text: "HOOOKAWWWWWWW....",
      displayName: "???",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_SURPRISED_STARTER_OUTFIT,
      text: "By the tides! That's your father's Hookaw!",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Scuttles?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "What happened to you?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
      text: "*panting*",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Looks like you flew through a hurricane!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Are my parents okay?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
      text: "Hookaw.. *panting*",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Where are they?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "What's this box for?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
      text: "Hookaw.. HOOKAW... *panting*",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "He's in \"Lockdown Mode.\" He won't deliver the message unless I give the clearance. Your father only uses this for... sensitive matters.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "Grandpa leans down and whispers into Scuttles' ear.",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: '*whispers* "Together we fly, alone we fall"',
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "Scuttles' eyes flash a soft green. The bird drops the box at Caleb's feet and opens its beak to speak.",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "(Dad's voice) Caleb... if you're hearing this, it means we didn't make it to your birthday...",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "(Mom's voice) We are so sorry my muffin! It breaks our hearts to miss this special day...",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "Dad! Mom! Are they okay?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "(Dad's voice) Listen carefully, Caleb... We found it! The Isle of Whispers! It's real!",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
      text: "...it's real?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "(Dad's voice) But... we were followed.. the navy.. or maybe pirates.. we have to hide it.. we can't let them find the isle...",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "(Mom's voice) Caleb.. Don't come looking for us, it's too dangerous! Take this gift from us, it's your birthday gift. Stay safe with Grandpa... We lo-",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "*Dad's voice* WATCH OUT! *CRASHING NOISE* *BZZZZT*",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
      text: "Hookaawwwww! Hookawww.. Hook.. *faints*",
      displayName: "Scuttles",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "They finally did it... Caleb, you have to-",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: '"Stay safe with Grandpa"? No way.',
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "I've seen that look. The same look your mother had when she sailed off. You're going after them, aren't you?",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: "They are in danger! The Navy or Pirates, I don't care who it is.",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: "NOBODY STOPS MY PARENTS FROM COMING HOME!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "You're just a boy! But... ",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "...you're a boy with salt in his veins. Alright then, lad. Let's get you prepared for a sea voyage.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "But first, let's open this birthday box of yours.",
      displayName: "Grandpa",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.MAP,
  },
};

export const ISLAND_INTRO_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      // Home Shore
      {
        portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
        text: "This is it. The beginning of my journey.",
        displayName: "Caleb",
      },
      {
        portraitKey: SpeakerImageKey.GUIDE,
        text: "Be careful out there, Caleb. The seas are unpredictable.",
        displayName: "Guide",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP, // TODO: Change to BATTLE when ready
    },
  },
  1: {
    sequence: [
      // Coral Reef
      {
        portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
        text: "Wow! Look at the colors!",
        displayName: "Caleb",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};

export const ISLAND_VICTORY_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      {
        portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
        text: "I did it! I cleared the Home Shore!",
        displayName: "Caleb",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};

export const ISLAND_DEFEAT_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      {
        portraitKey: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
        text: "Ouch... that was tough.",
        displayName: "Caleb",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};
