import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'wood'],
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Action',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Action',
  },
};

export const Wood: Story = {
  args: {
    variant: 'wood',
    children: 'Wood Pirate Action',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'wood',
    disabled: true,
    children: 'Locked Action',
  },
};
