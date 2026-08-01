import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/__tests__/utils/test-utils';
import DialogScreen from '@/app/components/dialogScreen';
import {
  BackgroundImageKey,
  DialogLine,
  SpeakerImageKey,
} from '@/types/baseGame';

describe('DialogScreen background dimming', () => {
  const renderDialog = (sequence: DialogLine[]) =>
    render(
      <DialogScreen
        sequence={sequence}
        onContinue={vi.fn()}
        onDialogAction={vi.fn()}
        backgroundImageKey={BackgroundImageKey.FIRST_TOWN_DOCKS}
      />
    );

  it('shows more of the background during narration-only lines', async () => {
    renderDialog([
      {
        text: 'The sea grows quiet.',
        portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      },
    ]);

    await waitFor(() =>
      expect(screen.getByAltText('Story background')).toHaveClass('opacity-75')
    );
  });

  it('keeps the stronger dimming when a character portrait is present', async () => {
    renderDialog([
      {
        text: 'We should keep moving.',
        portraits: [{ key: SpeakerImageKey.GUIDE, displayName: 'Caleb' }],
      },
    ]);

    await waitFor(() =>
      expect(screen.getByAltText('Story background')).toHaveClass('opacity-50')
    );
  });

  it('uses a line-specific background when one is provided', async () => {
    renderDialog([
      {
        text: 'A towering wave strikes the boat.',
        portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
        backgroundImageKey: BackgroundImageKey.LEVEL_2_WAVE_IMPACT,
      },
    ]);

    await waitFor(() =>
      expect(screen.getByAltText('Story background')).toHaveAttribute(
        'src',
        '/bg_level_2_wave_impact.png'
      )
    );
  });
});
