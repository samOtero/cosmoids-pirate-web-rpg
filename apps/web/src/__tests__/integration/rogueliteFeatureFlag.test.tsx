import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RoguelitePage from '@/app/roguelite/page';
import { isRogueliteEnabled } from '@/constants/featureFlags';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('Not found');
  },
}));
vi.mock('@/app/roguelite/RogueliteEntry', () => ({
  default: () => <div>Roguelite entry</div>,
}));
afterEach(() => vi.unstubAllEnvs());

describe('Roguelite availability', () => {
  it.each([undefined, '', 'false', '0', '1', 'TRUE'])(
    'keeps the direct route disabled for %s',
    (value) => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ROGUELITE', value);
      expect(isRogueliteEnabled()).toBe(false);
      expect(() => RoguelitePage()).toThrow('Not found');
      expect(screen.queryByText('Roguelite entry')).not.toBeInTheDocument();
    }
  );

  it('opens the direct route only when explicitly enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ROGUELITE', 'true');
    expect(isRogueliteEnabled()).toBe(true);
    render(RoguelitePage());
    expect(screen.getByText('Roguelite entry')).toBeInTheDocument();
  });
});
