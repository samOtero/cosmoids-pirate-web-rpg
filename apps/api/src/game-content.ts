export interface GameContent {
  profileVersion: number;
  maxLevel: number;
  maxPartySize: number;
  maxProfiles: number;
  gameFlags: string[];
  storyProgressions: number[];
  attackIds: number[];
  species: {
    id: number;
    genderRatio: 'genderless' | { female: number };
    learnableAttacks: { level: number; attackId: number }[];
    evolutionNodes: { level: number; evolutionDefId: number }[];
  }[];
}

/** The same compiled registry module is used by source development and dist. */
export async function loadGameContent(): Promise<GameContent> {
  const module = await import(
    new URL('../dist/authored-game-content.js', import.meta.url).href
  );
  return module.gameContent;
}
