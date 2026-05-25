import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import PartyScreen from './PartyScreen';
import { Creature, CosmoidTemplate } from '@/types/baseGame';
import {
  STARTER_IGUANA,
  STARTER_CRAB,
  STARTER_MONKEY,
  SENTICLE,
  MOUSE_1,
  BIRD_1,
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
} from '@/constants/creatures';

// Helper to create unique instances of creature definitions
const createMockInstance = (
  base: CosmoidTemplate,
  instanceNum: number,
  overrideOverrides?: Partial<Creature>
): Creature => {
  const hp = base.baseStats.hp;
  return {
    id: `${base.id}_instance_${instanceNum}`,
    speciesId: base.id,
    name: base.name,
    type: base.type,
    maxHp: hp,
    currentHp: overrideOverrides?.currentHp ?? hp,
    attack: base.baseStats.attack,
    defense: base.baseStats.defense,
    specialAttack: base.baseStats.specialAttack,
    specialDefense: base.baseStats.specialDefense,
    speed: base.baseStats.speed,
    baseExperience: base.baseExperience,
    level: 1,
    xp: 0,
    moves: base.learnableAttacks.map((a) => a.attackId),
    spriteUrl: base.spriteUrl,
    iconImg: base.iconImg,
    battleSpriteUrl: base.battleSpriteUrl,
    battlePosition: base.battlePosition,
    battleScale: base.battleScale,
    movementId: base.movementId,
    startingEnergy: base.startingEnergy,
    currentEnergy: base.startingEnergy,
    ...overrideOverrides,
  };
};

// Stateful wrapper to enable interactive drag/drop and tap-to-swap inside Storybook
function PartyScreenStoryWrapper({
  initialParty,
  initialStorage,
  onBack,
}: {
  initialParty: Creature[];
  initialStorage: Creature[];
  onBack: () => void;
}) {
  const [party, setParty] = useState<Creature[]>(initialParty);
  const [storage, setStorage] = useState<Creature[]>(initialStorage);

  const handleReorder = (startIndex: number, endIndex: number) => {
    const newParty = [...party];
    const newStorage = [...storage];

    const resolve = (globalIdx: number) => {
      if (globalIdx < 6) {
        return { arr: 'party' as const, localIdx: globalIdx };
      }
      return { arr: 'storage' as const, localIdx: globalIdx - 6 };
    };

    const src = resolve(startIndex);
    const dst = resolve(endIndex);

    const srcArr = src.arr === 'party' ? newParty : newStorage;
    if (src.localIdx < 0 || src.localIdx >= srcArr.length) return;

    const [removed] = srcArr.splice(src.localIdx, 1);

    const dstArr = dst.arr === 'party' ? newParty : newStorage;
    const clampedDstIdx = Math.max(0, Math.min(dst.localIdx, dstArr.length));
    dstArr.splice(clampedDstIdx, 0, removed);

    setParty(newParty);
    setStorage(newStorage);
  };

  return (
    <div className="h-screen w-full overflow-hidden">
      <PartyScreen
        creatures={party}
        storageCreatures={storage}
        onBack={onBack}
        onReorder={handleReorder}
      />
    </div>
  );
}

const meta: Meta<typeof PartyScreen> = {
  title: 'Components/PartyScreen',
  component: PartyScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobileLandscape',
    },
  },
  argTypes: {
    onBack: { action: 'back clicked' },
    onReorder: { action: 'reorder triggered' },
  },
};

export default meta;

type Story = StoryObj<typeof PartyScreen>;

// Story 1: Interactive Default Story with a full team and a few items in storage
export const InteractiveDefault: Story = {
  render: (args) => {
    const mockParty: Creature[] = [
      createMockInstance(STARTER_IGUANA, 1, {
        name: 'Blazy',
        level: 15,
        currentHp: 38,
      }),
      createMockInstance(STARTER_CRAB, 2, {
        name: 'Crabby',
        level: 12,
        currentHp: 55,
      }),
      createMockInstance(STARTER_MONKEY, 3, {
        name: 'Bubbles',
        level: 10,
        currentHp: 15,
      }),
      createMockInstance(SENTICLE, 4, { level: 8 }),
      createMockInstance(BUG_STAGE_2, 5, { level: 9 }),
      createMockInstance(BIRD_1, 6, { level: 5 }),
    ];

    const mockStorage: Creature[] = [
      createMockInstance(MOUSE_1, 7, { level: 4 }),
      createMockInstance(BUG_STAGE_1, 8, { level: 3 }),
      createMockInstance(BUG_STAGE_3, 9, { level: 18 }),
      createMockInstance(SENTICLE, 10, { name: 'Salty Senticle', level: 14 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialParty={mockParty}
        initialStorage={mockStorage}
        onBack={args.onBack}
      />
    );
  },
};

// Story 2: Minimal party with just the starter, showing empty active slots and empty storage
export const StarterOnly: Story = {
  render: (args) => {
    const mockParty: Creature[] = [
      createMockInstance(STARTER_CRAB, 1, { name: 'My Starter', level: 5 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialParty={mockParty}
        initialStorage={[]}
        onBack={args.onBack}
      />
    );
  },
};

// Story 3: Large roster showing multi-page Box storage pagination
export const LargeRosterPagination: Story = {
  render: (args) => {
    const mockParty: Creature[] = [
      createMockInstance(STARTER_IGUANA, 1, { level: 20 }),
      createMockInstance(STARTER_CRAB, 2, { level: 19 }),
      createMockInstance(STARTER_MONKEY, 3, { level: 18 }),
      createMockInstance(SENTICLE, 4, { level: 16 }),
      createMockInstance(BUG_STAGE_3, 5, { level: 15 }),
      createMockInstance(BIRD_1, 6, { level: 14 }),
    ];

    const mockStorage: Creature[] = [
      createMockInstance(MOUSE_1, 7, { name: 'Storage 1', level: 2 }),
      createMockInstance(BUG_STAGE_1, 8, { name: 'Storage 2', level: 2 }),
      createMockInstance(BUG_STAGE_2, 9, { name: 'Storage 3', level: 6 }),
      createMockInstance(BIRD_1, 10, { name: 'Storage 4', level: 4 }),
      createMockInstance(SENTICLE, 11, { name: 'Storage 5', level: 5 }),
      createMockInstance(STARTER_CRAB, 12, { name: 'Storage 6', level: 5 }),
      createMockInstance(STARTER_MONKEY, 13, { name: 'Storage 7', level: 5 }),
      createMockInstance(STARTER_IGUANA, 14, { name: 'Storage 8', level: 5 }),
      createMockInstance(BUG_STAGE_3, 15, { name: 'Storage 9', level: 12 }),
      createMockInstance(MOUSE_1, 16, { name: 'Storage 10', level: 3 }),
      createMockInstance(BUG_STAGE_1, 17, { name: 'Storage 11', level: 2 }),
      createMockInstance(SENTICLE, 18, { name: 'Storage 12', level: 7 }),
      createMockInstance(BIRD_1, 19, { name: 'Storage 13', level: 8 }),
      createMockInstance(STARTER_CRAB, 20, { name: 'Storage 14', level: 1 }),
      createMockInstance(STARTER_MONKEY, 21, { name: 'Storage 15', level: 1 }),
      createMockInstance(STARTER_IGUANA, 22, { name: 'Storage 16', level: 1 }),
      createMockInstance(BUG_STAGE_2, 23, { name: 'Storage 17', level: 8 }),
      createMockInstance(MOUSE_1, 24, { name: 'Storage 18', level: 4 }),
      createMockInstance(BUG_STAGE_3, 25, { name: 'Storage 19', level: 15 }),
      createMockInstance(SENTICLE, 26, { name: 'Storage 20', level: 9 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialParty={mockParty}
        initialStorage={mockStorage}
        onBack={args.onBack}
      />
    );
  },
};
