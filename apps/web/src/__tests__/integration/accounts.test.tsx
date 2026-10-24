import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';

const api = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  return { fetch };
});

import { authClient } from '@/lib/auth-client';
import AuthProvider from '@/app/components/auth/AuthProvider';
import StartScreen from '@/app/components/startScreen';
import ProfileScreen from '@/app/components/profileScreen';

vi.mock('@/utils/analytics', () => ({ trackGameEvent: vi.fn() }));

const user = {
  id: 'test-account',
  name: 'Test captain',
  email: 'captain@example.com',
  emailVerified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const validSession = {
  user,
  session: {
    id: 'test-session',
    token: 'test-token',
    userId: user.id,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};
let serverSession: typeof validSession | null;
let rejectedLogin: number | null;
let sessionFailure: boolean;
let acceptCookie: boolean;

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function showStart() {
  const onStart = vi.fn();
  function GameScreens() {
    const [showProfiles, setShowProfiles] = useState(false);
    return showProfiles ? (
      <ProfileScreen
        profiles={[null, null, null]}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onBack={() => setShowProfiles(false)}
      />
    ) : (
      <StartScreen
        onStart={() => {
          onStart();
          setShowProfiles(true);
        }}
      />
    );
  }
  render(
    <AuthProvider>
      <GameScreens />
    </AuthProvider>
  );
  return onStart;
}

async function openForm(action: 'Log in' | 'Create account') {
  const button = await screen.findByRole('button', {
    name: action,
  });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  return screen.getByRole('dialog', { name: action });
}

function fillForm(dialog: HTMLElement, signup = false) {
  if (signup)
    fireEvent.change(within(dialog).getByLabelText('Display name'), {
      target: { value: 'Test captain' },
    });
  fireEvent.change(within(dialog).getByLabelText('Email'), {
    target: { value: 'captain@example.com' },
  });
  fireEvent.change(within(dialog).getByLabelText('Password'), {
    target: { value: 'a-test-password-123' },
  });
}

describe('account UI with the real Better Auth client', () => {
  beforeAll(() => {
    // jsdom doesn't implement the native dialog top layer.
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value() {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value() {
        this.removeAttribute('open');
      },
    });
  });
  beforeEach(async () => {
    serverSession = null;
    rejectedLogin = null;
    sessionFailure = false;
    acceptCookie = true;
    api.fetch.mockReset();
    api.fetch.mockImplementation(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input)
        );
        if (url.pathname.endsWith('/get-session')) {
          return sessionFailure
            ? json({ message: 'unavailable', code: 'UNAVAILABLE' }, 503)
            : json(serverSession);
        }
        if (url.pathname.endsWith('/sign-out')) {
          serverSession = null;
          return json({ success: true });
        }
        if (url.pathname.endsWith('/request-password-reset')) {
          return rejectedLogin
            ? json(
                {
                  code:
                    rejectedLogin === 429
                      ? 'TOO_MANY_REQUESTS'
                      : 'RESET_PASSWORD_DISABLED',
                },
                rejectedLogin
              )
            : json({ status: true });
        }
        if (
          url.pathname.endsWith('/sign-in/email') ||
          url.pathname.endsWith('/sign-up/email')
        ) {
          if (rejectedLogin)
            return json(
              {
                code:
                  rejectedLogin === 429
                    ? 'TOO_MANY_REQUESTS'
                    : 'INVALID_EMAIL_OR_PASSWORD',
                message: 'Test error',
              },
              rejectedLogin
            );
          if (acceptCookie) serverSession = validSession;
          return json({ token: validSession.session.token, user });
        }
        throw new Error(`Unexpected request ${url.pathname} ${init?.method}`);
      }
    );
    // Reset the client's session through its public API between cases.
    await act(async () => {
      await authClient.signOut();
      await authClient.$store.atoms.session.get().refetch();
    });
    api.fetch.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  afterAll(() => {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('creates an account, sends credentials, confirms the session, and leaves local saves intact', async () => {
    localStorage.setItem('cosmoids-game-state', 'existing-local-save');
    const onStart = showStart();
    const dialog = await openForm('Create account');
    fillForm(dialog, true);
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Create account',
      })
    );
    expect(await screen.findByText(/Signed in as/)).toHaveTextContent(
      user.name
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    const call = api.fetch.mock.calls.find(([url]) =>
      String(url).endsWith('/sign-up/email')
    )!;
    expect(call[1].credentials).toBe('include');
    expect(JSON.parse(call[1].body)).toEqual({
      name: user.name,
      email: user.email,
      password: 'a-test-password-123',
    });
    expect(localStorage.getItem('cosmoids-game-state')).toBe(
      'existing-local-save'
    );
    expect(
      screen.getByRole('heading', { name: 'Select Save File' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continue' })
    ).not.toBeInTheDocument();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('requests a reset from login without signing in or changing guest saves', async () => {
    localStorage.setItem('cosmoids-game-state', 'existing-guest-save');
    const onStart = showStart();
    const dialog = await openForm('Log in');
    fillForm(dialog);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Forgot password?' })
    );
    expect(screen.getByRole('dialog', { name: 'Reset password' })).toBe(dialog);
    expect(within(dialog).queryByLabelText('Password')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Email')).toHaveValue(
      'captain@example.com'
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Send reset link' })
    );
    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      /If an account uses that email/
    );
    const call = api.fetch.mock.calls.find(([url]) =>
      String(url).endsWith('/request-password-reset')
    )!;
    expect(JSON.parse(call[1].body)).toEqual({
      email: 'captain@example.com',
      redirectTo: `${window.location.origin}/reset-password`,
    });
    expect(call[1].credentials).toBe('include');
    expect(onStart).not.toHaveBeenCalled();
    expect(localStorage.getItem('cosmoids-game-state')).toBe(
      'existing-guest-save'
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Back to log in' })
    );
    expect(screen.getByRole('dialog', { name: 'Log in' })).toBe(dialog);
    expect(within(dialog).getByLabelText('Password')).toHaveValue('');
  });

  it.each([429, 400])(
    'handles password-recovery failure %s without a false confirmation',
    async (status) => {
      rejectedLogin = status;
      showStart();
      const dialog = await openForm('Log in');
      fillForm(dialog);
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Forgot password?' })
      );
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Send reset link' })
      );
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        status === 429 ? /Too many attempts/ : /recovery isn’t available/
      );
      expect(
        within(dialog).getByRole('button', { name: 'Send reset link' })
      ).toBeEnabled();
      expect(
        within(dialog).queryByText(/If an account uses/)
      ).not.toBeInTheDocument();
    }
  );

  it('logs in, returns to the title without logging out, and logs out without deleting local progress', async () => {
    localStorage.setItem('cosmoids-game-state', 'existing-local-save');
    const onStart = showStart();
    const dialog = await openForm('Log in');
    fillForm(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('heading', { name: 'Select Save File' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent(user.name);
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      screen.getByRole('heading', { name: 'COSMOIDS TD' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent(user.name);
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Play offline' })
    ).not.toBeInTheDocument();
    expect(serverSession).toEqual(validSession);
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Select Save File' })
      ).not.toBeInTheDocument()
    );
    expect(
      await screen.findByRole('button', { name: 'Play offline' })
    ).toBeEnabled();
    expect(localStorage.getItem('cosmoids-game-state')).toBe(
      'existing-local-save'
    );
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toBeEnabled();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it.each([401, 429])(
    'shows a useful error when login returns %s',
    async (status) => {
      rejectedLogin = status;
      const onStart = showStart();
      const dialog = await openForm('Log in');
      fillForm(dialog);
      fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        status === 429 ? /Too many attempts/ : /combination is incorrect/
      );
      expect(
        within(dialog).getByRole('button', { name: 'Log in' })
      ).toBeEnabled();
      expect(onStart).not.toHaveBeenCalled();
    }
  );

  it('does not report a successful login when the browser session cannot be confirmed', async () => {
    acceptCookie = false;
    const onStart = showStart();
    const dialog = await openForm('Log in');
    fillForm(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn’t confirm your login/
    );
    expect(
      screen.queryByRole('button', { name: 'Continue' })
    ).not.toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: 'Select Save File' })
    ).not.toBeInTheDocument();
  });

  it('keeps guest play available when session checking fails', async () => {
    sessionFailure = true;
    const onStart = showStart();
    // Setup just fetched a healthy session. Explicitly check again instead of
    // depending on whether the client's short mount-deduplication window elapsed.
    await act(async () => {
      await authClient.$store.atoms.session.get().refetch();
    });
    expect(
      await screen.findByText(/couldn’t check your account/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play offline' }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('heading', { name: 'Select Save File' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByRole('button', { name: 'Play offline' })
    ).toBeEnabled();
  });

  it('restores the session on mount and retains it after a failed tab-return check', async () => {
    serverSession = validSession;
    const onStart = showStart();
    expect(await screen.findByText(/Signed in as/)).toHaveTextContent(
      user.name
    );
    expect(
      screen.queryByRole('heading', { name: 'Select Save File' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Play offline' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log in' })
    ).not.toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
    sessionFailure = true;
    const later = Date.now() + 20000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    fireEvent(document, new Event('visibilitychange'));
    expect(
      await screen.findByText(/couldn’t check your account/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent(user.name);
    Reflect.deleteProperty(document, 'visibilityState');
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(
      screen.getByRole('heading', { name: 'Select Save File' })
    ).toBeInTheDocument();
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent(user.name);
    expect(onStart).toHaveBeenCalledOnce();
  });
});
