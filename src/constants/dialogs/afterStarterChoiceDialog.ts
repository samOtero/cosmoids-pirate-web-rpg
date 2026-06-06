import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
  DialogContext,
} from "@/types/baseGame";

export const AFTER_STARTER_CHOICE_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Suddenly, a high-pitched screech is heard from the sky.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Grandpa! Watch out! It's coming straight at you!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_DIVE_SKIN_1,
          displayName: "???",
        },
      ],
      text: "HOOOKAWWWWWWW....!",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "The bird crashes onto the wooden planks, sliding to a halt at Caleb's feet.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Scuttles?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "Hookaw.. *panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "You look like you flew through a hurricane!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "*panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Where are my parents?! Are they okay?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "Hookaw.. HOOKAW... *panting*",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Caleb reaches for the bird, but Scuttles snaps his beak shut and hops back defensively.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "He's guarding a message. He won't talk unless we give it right code words. Your father trained him well.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Grandpa leans down and whispers into Scuttles' ear.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: '*whispers* "Together we fly, alone we fall"',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Scuttles opens its beak to speak. What comes out isn't a bird's squawk.. it is Caleb's father's voice, perfectly mimicked.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Dad's voice) Caleb... if you're hearing this, it means we didn't make it to your birthday. We are so sorry...",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Dad's voice) But listen carefully... We found it! The Isle of Whispers! It's real!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "...It's real?",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Scuttles shifts his stance, instantly switching to the soft, urgent tone of Caleb's mother.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Mom's voice) We were followed. We have to hide the location. Caleb, do NOT come looking for us. It's too dangerous.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Mom's voice) I hope you liked your birthday gift. Stay safe with Grandpa. We lo—",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Suddenly, Scuttles mimics a deafening CRASH—the sound of splintering wood and cannon fire—before letting out a weak, exhausted peep.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "Hookaawwwww! Hookawww.. Hook.. *faints*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "They finally did it... Caleb, you have to-",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: '"Stay safe"? No way. I\'m going after them.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "I've seen that look. The same look your mother had when she sailed off.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "They are in danger! The Navy, Pirates or Monsters, I don't care who it is.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "NOBODY STOPS MY PARENTS FROM COMING HOME!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "Slow clapping interrupts them. A scruffy man steps from the shadows, eyeing the fainted parrot.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK,
          displayName: "Grunt Pirate Joe",
        },
      ],
      text: "Very touching. But I'll take that bird now. My Captain will pay a great bounty for that message.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "You're not touching Scuttles!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "Caleb steps in front of Scuttles.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          displayName: "Grunt Pirate Joe",
        },
      ],
      text: "Have it your way, kid. If you won't hand it over, I'll take it by force!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "The pirate throws a dark, scratched doubloon onto the dock.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: "Senticle",
          portraitWidth: "wide",
        },
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING,
          displayName: "Grunt Pirate Joe",
          portraitWidth: "wide",
        },
      ],
      text: "Tear him up, Senticle!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "It's a battle, Caleb! Use the gift your parents left you!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Right... Let's go, partner! I choose YOU!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
