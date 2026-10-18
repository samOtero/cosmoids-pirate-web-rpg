import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { STARTER_IGUANA } from '@/constants/creatures';
import { TD_LEVELS } from '@/constants/tdLevels';
import { TDLevelContext } from '@/types/baseGame';
import { AttackId } from '@/types/definitionIds';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { LearnedAttackDialog } from './LearnedAttackDialog';

const known = [
  AttackId.SCRATCH,
  AttackId.FIRE_CLAW,
  AttackId.FUSE_RUSH,
  AttackId.SUNBATHE,
].map((id) => ATTACK_DEFS[id]);
const meta = {
  title: 'Battle/Move learning',
  component: LearnedAttackDialog,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        className="min-h-screen bg-slate-900 bg-cover bg-center"
        style={{
          backgroundImage: `url(${TD_LEVELS[TDLevelContext.FIRST_LEVEL].levelData.backgroundUrl})`,
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    creatureName: STARTER_IGUANA.name,
    creatureIcon: STARTER_IGUANA.iconImg,
    attack: ATTACK_DEFS[AttackId.EMBER],
    onClose: fn(),
  },
} satisfies Meta<typeof LearnedAttackDialog>;
export default meta;
type Story = StoryObj<typeof LearnedAttackDialog>;

export const Learned: Story = {
  args: { isActive: false, canActivate: true, onActivate: fn() },
};

const replacement = {
  known,
  activeIndex: 0,
  canRelearn: () => true,
  onReplace: fn(),
};
export const TryingToLearn: Story = { args: { replacement } };

export const ChooseReplacement: Story = {
  args: { replacement },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Replace a Move' })
    );
    await expect(
      canvas.getByRole('button', { name: 'Select a move to replace' })
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Compare with ' + known[0].name })
    );
    await expect(
      canvas.getByRole('button', {
        name:
          'Replace ' +
          known[0].name +
          ' with ' +
          ATTACK_DEFS[AttackId.EMBER].name,
      })
    ).toBeEnabled();
  },
};
