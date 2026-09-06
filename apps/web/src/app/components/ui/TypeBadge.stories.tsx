import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TypeBadge } from './TypeBadge';
import { ElementType } from '@/types/baseGame';

const meta: Meta<typeof TypeBadge> = {
  title: 'UI/TypeBadge',
  component: TypeBadge,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: Object.values(ElementType),
    },
  },
};

export default meta;
type Story = StoryObj<typeof TypeBadge>;

export const Water: Story = {
  args: {
    type: ElementType.WATER,
  },
};

export const Fire: Story = {
  args: {
    type: ElementType.FIRE,
  },
};

export const Grass: Story = {
  args: {
    type: ElementType.GRASS,
  },
};

export const Electric: Story = {
  args: {
    type: ElementType.ELECTRIC,
  },
};

export const Normal: Story = {
  args: {
    type: ElementType.NORMAL,
  },
};

export const Flying: Story = {
  args: {
    type: ElementType.FLYING,
  },
};
