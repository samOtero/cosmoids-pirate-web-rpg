import type { PlayerCreature, Profile } from './baseGame';

/** Account identity comes from the session, not a field in a save request. */
export type CloudProfileData = Omit<
  Profile,
  'id' | 'ownerId' | 'version' | 'creatures' | 'storageCreatures'
>;

export interface CloudProfileSnapshot {
  profileVersion: number;
  profileData: CloudProfileData;
  creatures: CloudCreatureInput[];
  storageCreatures: CloudCreatureInput[];
}

/** Ownership is assigned/preserved by the API, never submitted by the browser. */
export type CloudCreatureInput = Omit<PlayerCreature, 'originalOwnerId'>;

export interface CloudStorageBox {
  id: string;
  name: string;
  position: number;
  creatureIds: string[];
}

export interface CloudProfileBaseline extends CloudProfileSnapshot {
  storageBoxes: CloudStorageBox[];
}

export interface CloudProfileChanges {
  profileVersion: number;
  profileData?: CloudProfileData;
  creatureChanges: {
    added: CloudCreatureInput[];
    updated: CloudCreatureInput[];
    order?: { party?: string[]; storage?: CloudStorageBox[] };
  };
}

/** Keep the server UUID/revision distinct from the game's numeric slot ID. */
export interface CloudProfileMetadata {
  id: string;
  slot: number;
  profileVersion: number;
  revision: number;
  createdAt: string;
  savedAt: string;
}

export interface CloudProfile
  extends CloudProfileMetadata, CloudProfileSnapshot {
  creatures: PlayerCreature[];
  storageCreatures: PlayerCreature[];
  storageBoxes: CloudStorageBox[];
}

export interface CloudProfileSummary {
  id: string;
  slot: number;
  profileVersion: number;
  revision: number;
  name: string;
  lastPlayed: number;
  storyProgression: number;
  partyCount: number;
  storageCount: number;
  savedAt: string;
}

export interface CloudProfileList {
  slots: (CloudProfileSummary | null)[];
}

export type CloudProfileReference = Pick<
  CloudProfileMetadata,
  'id' | 'revision'
>;

/** Prepared for in-memory account play; this type does not persist anything. */
export interface CloudProfileWorkingCopy {
  profile: Profile;
  cloud: CloudProfileMetadata;
  storageBoxes: CloudStorageBox[];
  baseline: CloudProfileBaseline;
}

export interface CloudProfileSaveResult {
  cloud: CloudProfileMetadata;
  /** The submitted snapshot, even if play continued while the request ran. */
  baseline: CloudProfileBaseline;
}
