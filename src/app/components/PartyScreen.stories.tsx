import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import PartyScreen from './PartyScreen';
import { Creature } from '@/types/baseGame';
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
  base: Creature,
  instanceNum: number,
  overrideOverrides?: Partial<Creature>
): Creature => {
  return {
    ...base,
    id: `${base.id}_instance_${instanceNum}`,
    speciesId: base.id,
    currentHp: overrideOverrides?.currentHp ?? base.maxHp,
    ...overrideOverrides,
  };
};

// Stateful wrapper to enable interactive drag/drop and tap-to-swap inside Storybook
function PartyScreenStoryWrapper({
  initialCreatures,
  onBack,
}: {
  initialCreatures: Creature[];
  onBack: () => void;
}) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);

  const handleReorder = (startIndex: number, endIndex: number) => {
    if (startIndex < 0 || startIndex >= creatures.length) return;

    const updated = [...creatures];
    const clampedEndIndex = Math.max(0, Math.min(endIndex, creatures.length - 1));

    const [removed] = updated.splice(startIndex, 1);
    updated.splice(clampedEndIndex, 0, removed);

    setCreatures(updated);
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <PartyScreen
        creatures={creatures}
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
    const mockCreatures: Creature[] = [
      // Active team (first 6 slots)
      createMockInstance(STARTER_IGUANA, 1, { name: 'Blazy', level: 15, currentHp: 38 }),
      createMockInstance(STARTER_CRAB, 2, { name: 'Crabby', level: 12, currentHp: 55 }),
      createMockInstance(STARTER_MONKEY, 3, { name: 'Bubbles', level: 10, currentHp: 15 }), // Weak/Damaged HP bar check
      createMockInstance(SENTICLE, 4, { level: 8 }),
      createMockInstance(BUG_STAGE_2, 5, { level: 9 }),
      createMockInstance(BIRD_1, 6, { level: 5 }),
      // Storage creatures
      createMockInstance(MOUSE_1, 7, { level: 4 }),
      createMockInstance(BUG_STAGE_1, 8, { level: 3 }),
      createMockInstance(BUG_STAGE_3, 9, { level: 18 }),
      createMockInstance(SENTICLE, 10, { name: 'Salty Senticle', level: 14 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialCreatures={mockCreatures}
        onBack={args.onBack}
      />
    );
  },
};

// Story 2: Minimal party with just the starter, showing empty active slots and empty storage
export const StarterOnly: Story = {
  render: (args) => {
    const mockCreatures: Creature[] = [
      createMockInstance(STARTER_CRAB, 1, { name: 'My Starter', level: 5 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialCreatures={mockCreatures}
        onBack={args.onBack}
      />
    );
  },
};

// Story 3: Large roster showing multi-page Box storage pagination
export const LargeRosterPagination: Story = {
  render: (args) => {
    // 6 active + 20 storage = 26 creatures. Under mobile landscape (6/page), this will create 4 storage pages!
    const mockCreatures: Creature[] = [
      // Active team
      createMockInstance(STARTER_IGUANA, 1, { level: 20 }),
      createMockInstance(STARTER_CRAB, 2, { level: 19 }),
      createMockInstance(STARTER_MONKEY, 3, { level: 18 }),
      createMockInstance(SENTICLE, 4, { level: 16 }),
      createMockInstance(BUG_STAGE_3, 5, { level: 15 }),
      createMockInstance(BIRD_1, 6, { level: 14 }),
      // Storage Box 1
      createMockInstance(MOUSE_1, 7, { name: 'Storage 1', level: 2 }),
      createMockInstance(BUG_STAGE_1, 8, { name: 'Storage 2', level: 2 }),
      createMockInstance(BUG_STAGE_2, 9, { name: 'Storage 3', level: 6 }),
      createMockInstance(BIRD_1, 10, { name: 'Storage 4', level: 4 }),
      createMockInstance(SENTICLE, 11, { name: 'Storage 5', level: 5 }),
      createMockInstance(STARTER_CRAB, 12, { name: 'Storage 6', level: 5 }),
      // Storage Box 2
      createMockInstance(STARTER_MONKEY, 13, { name: 'Storage 7', level: 5 }),
      createMockInstance(STARTER_IGUANA, 14, { name: 'Storage 8', level: 5 }),
      createMockInstance(BUG_STAGE_3, 15, { name: 'Storage 9', level: 12 }),
      createMockInstance(MOUSE_1, 16, { name: 'Storage 10', level: 3 }),
      createMockInstance(BUG_STAGE_1, 17, { name: 'Storage 11', level: 2 }),
      createMockInstance(SENTICLE, 18, { name: 'Storage 12', level: 7 }),
      // Storage Box 3
      createMockInstance(BIRD_1, 19, { name: 'Storage 13', level: 8 }),
      createMockInstance(STARTER_CRAB, 20, { name: 'Storage 14', level: 1 }),
      createMockInstance(STARTER_MONKEY, 21, { name: 'Storage 15', level: 1 }),
      createMockInstance(STARTER_IGUANA, 22, { name: 'Storage 16', level: 1 }),
      createMockInstance(BUG_STAGE_2, 23, { name: 'Storage 17', level: 8 }),
      createMockInstance(MOUSE_1, 24, { name: 'Storage 18', level: 4 }),
      // Storage Box 4
      createMockInstance(BUG_STAGE_3, 25, { name: 'Storage 19', level: 15 }),
      createMockInstance(SENTICLE, 26, { name: 'Storage 20', level: 9 }),
    ];

    return (
      <PartyScreenStoryWrapper
        initialCreatures={mockCreatures}
        onBack={args.onBack}
      />
    );
  },
};
