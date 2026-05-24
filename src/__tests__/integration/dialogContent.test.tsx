import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/__tests__/utils/test-utils';
import DialogContent from '@/app/components/ui/DialogContent';
import { DialogLine, SpeakerImageKey } from '@/types/baseGame';

describe('DialogContent Flipped Portrait Rendering', () => {
  const mockOnContinue = vi.fn();
  const mockOnDialogAction = vi.fn();

  it('should render standard layout flipped portraits with scale-x-[-1]', () => {
    const sequence: DialogLine[] = [
      {
        text: 'Hello test!',
        portraits: [
          {
            key: SpeakerImageKey.GUIDE,
            displayName: 'Guide Person',
            flipped: true,
          },
        ],
      },
    ];

    render(
      <DialogContent
        sequence={sequence}
        onContinue={mockOnContinue}
        onDialogAction={mockOnDialogAction}
      />
    );

    const img = screen.getByAltText('Guide Person');
    expect(img).toBeInTheDocument();
    expect(img.className).toContain('scale-x-[-1]');
  });

  it('should render battle layout flipped portraits with scale-x-[-1]', () => {
    const sequence: DialogLine[] = [
      {
        text: 'Hello battle test!',
        layout: 'battle-left',
        portraits: [
          {
            key: SpeakerImageKey.GUIDE,
            displayName: 'Guide Person Flipped',
            flipped: true,
          },
        ],
      },
    ];

    render(
      <DialogContent
        sequence={sequence}
        onContinue={mockOnContinue}
        onDialogAction={mockOnDialogAction}
      />
    );

    const img = screen.getByAltText('Guide Person Flipped');
    expect(img).toBeInTheDocument();
    expect(img.className).toContain('scale-x-[-1]');
  });

  it('should render unflipped portraits without scale-x-[-1]', () => {
    const sequence: DialogLine[] = [
      {
        text: 'Hello unflipped test!',
        portraits: [
          {
            key: SpeakerImageKey.GUIDE,
            displayName: 'Guide Person Unflipped',
            flipped: false,
          },
        ],
      },
    ];

    render(
      <DialogContent
        sequence={sequence}
        onContinue={mockOnContinue}
        onDialogAction={mockOnDialogAction}
      />
    );

    const img = screen.getByAltText('Guide Person Unflipped');
    expect(img).toBeInTheDocument();
    expect(img.className).not.toContain('scale-x-[-1]');
  });
});
