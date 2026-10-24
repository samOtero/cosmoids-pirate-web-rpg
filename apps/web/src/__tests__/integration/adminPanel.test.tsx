import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { makeProfile, makePlayerCreature } from '../utils/dataBuilders';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import AdminPanel from '@/app/components/admin/AdminPanel';
import GameChrome from '@/app/components/GameChrome';

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email: string } },
  enabled: true,
  fetch: vi.fn(),
  pathname: '/admin',
}));
vi.mock('@/app/components/auth/AuthProvider', () => ({
  useAccount: () => ({
    session: state.session,
    enabled: state.enabled,
    isPending: false,
    hasError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { signOut: vi.fn() },
  getAuthErrorMessage: vi.fn(),
}));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));

const registered = Object.values(COSMOID_TEMPLATES)[0];
const profileId = '00000000-0000-4000-8000-000000000001';
const profile = makeProfile({
  name: 'Harbor voyage',
  creatures: [],
  storageCreatures: [],
  inventory: [],
});
const creature = {
  ...makePlayerCreature({
    id: 'inspected-creature',
    speciesId: registered.id,
    originalOwnerId: 'original-captain',
    level: 7,
  }),
  accountId: 'player-2',
  profileId,
  location: 'storage',
  position: 0,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};
const saved = {
  id: profileId,
  accountId: 'player-2',
  slot: 0,
  profileVersion: 12,
  revision: 4,
  profileData: profile,
  partyCount: 0,
  storageCount: 1,
  createdAt: '2026-10-01T00:00:00Z',
  savedAt: '2026-10-02T00:00:00Z',
};
const player = {
  id: 'player-2',
  name: 'Harbor captain',
  email: 'harbor@example.test',
  emailVerified: false,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  profileCount: 1,
  creatureCount: 1,
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
function responses(url: string) {
  const path = new URL(url).pathname;
  if (path.endsWith('/session')) return json({ allowed: true });
  if (path.endsWith('/accounts'))
    return json({ items: [player], total: 1, limit: 20, offset: 0 });
  if (path.endsWith('/accounts/player-2'))
    return json({
      account: player,
      slots: [saved, null, null],
      tradeBox: { revision: null, updatedAt: null, creatureCount: 0 },
    });
  if (path.endsWith('/profiles/' + profileId)) return json(saved);
  if (path.endsWith('/accounts/player-2/creatures')) {
    const storage = new URL(url).searchParams.get('location') === 'storage';
    return json({
      items: storage ? [creature] : [],
      total: storage ? 1 : 0,
      limit: 24,
      offset: 0,
    });
  }
  if (path.endsWith('/creatures/inspected-creature')) return json(creature);
  throw new Error('Unexpected request: ' + url);
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  state.session = { user: { id: 'admin-1', email: 'admin@example.test' } };
  state.enabled = true;
  state.pathname = '/admin';
  state.fetch
    .mockReset()
    .mockImplementation(async (url: string) => responses(url));
  vi.stubGlobal('fetch', state.fetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('admin requires login and does not fetch private records while signed out', () => {
  state.session = null;
  render(<AdminPanel />);
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  expect(state.fetch).not.toHaveBeenCalled();
});

test('a regular account sees an access denial without querying player records', async () => {
  state.fetch.mockResolvedValue(json({}, 403));
  render(<AdminPanel />);
  expect(await screen.findByText('Admin access required')).toBeInTheDocument();
  expect(state.fetch).toHaveBeenCalledTimes(1);
  expect(String(state.fetch.mock.calls[0][0])).toContain('/api/admin/session');
});

test(
  'an administrator searches accounts and inspects storage creature ownership',
  { timeout: 15000 },
  async () => {
    render(<AdminPanel />);
    await screen.findByRole('heading', { name: 'Player accounts' });
    fireEvent.change(
      screen.getByLabelText('Search by email, name or account ID'),
      { target: { value: 'harbor@example.test' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(
        state.fetch.mock.calls.some(([url]) =>
          String(url).includes('q=harbor%40example.test')
        )
      ).toBe(true)
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Harbor captain.*Inspect/ })
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Profile 1.*Harbor voyage/ })
    );
    await screen.findByRole('region', { name: 'Profile details' });
    fireEvent.click(screen.getByRole('button', { name: 'Storage (1)' }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(registered.name + '.*Lv. 7'),
      })
    );
    expect(await screen.findByText('original-captain')).toBeInTheDocument();
    expect(screen.getByText('inspected-creature')).toBeInTheDocument();
    expect(screen.getByText('Revision 4')).toBeInTheDocument();
    for (const [, options] of state.fetch.mock.calls)
      expect(options).toMatchObject({
        credentials: 'include',
        cache: 'no-store',
      });
  }
);

test(
  'an expired admin session clears inspected player data',
  { timeout: 15000 },
  async () => {
    render(<AdminPanel />);
    fireEvent.click(
      await screen.findByRole('button', { name: /Harbor captain.*Inspect/ })
    );
    await screen.findByRole('button', { name: /Profile 1.*Harbor voyage/ });
    state.fetch.mockResolvedValue(json({}, 401));
    fireEvent.click(
      screen.getByRole('button', { name: /Profile 1.*Harbor voyage/ })
    );
    expect(
      await screen.findByRole('heading', { name: 'Log in again' })
    ).toBeInTheDocument();
    expect(screen.queryByText('harbor@example.test')).not.toBeInTheDocument();
    expect(screen.queryByText('Harbor voyage')).not.toBeInTheDocument();
  }
);

test('network errors can be retried and admin pages do not show game overlays', async () => {
  state.fetch.mockRejectedValueOnce(new Error('Connection unavailable'));
  render(
    <>
      <GameChrome>
        <div>Rotate game overlay</div>
      </GameChrome>
      <AdminPanel />
    </>
  );
  expect(screen.queryByText('Rotate game overlay')).not.toBeInTheDocument();
  expect(await screen.findByText('Connection unavailable')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('heading', { name: 'Player accounts' })
  ).toBeInTheDocument();
});

test('game pages retain their game overlays', () => {
  state.pathname = '/';
  render(
    <GameChrome>
      <div>Rotate game overlay</div>
    </GameChrome>
  );
  expect(screen.getByText('Rotate game overlay')).toBeInTheDocument();
});

test('password recovery supports portrait screens without game overlays', () => {
  state.pathname = '/reset-password';
  render(
    <GameChrome>
      <div>Rotate game overlay</div>
    </GameChrome>
  );
  expect(screen.queryByText('Rotate game overlay')).not.toBeInTheDocument();
});
