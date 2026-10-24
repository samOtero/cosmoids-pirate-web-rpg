import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

const api = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  return { fetch };
});
import ResetPasswordScreen from '@/app/components/auth/ResetPasswordScreen';

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
async function openReset(fragment = '#token=controlled-reset-token') {
  window.history.replaceState(null, '', `/reset-password${fragment}`);
  render(
    <StrictMode>
      <ResetPasswordScreen />
    </StrictMode>
  );
  await waitFor(() =>
    expect(
      screen.queryByText(/Opening your reset link/)
    ).not.toBeInTheDocument()
  );
}
function fillPassword(confirmation = 'replacement-password-123') {
  fireEvent.change(screen.getByLabelText('New password'), {
    target: { value: 'replacement-password-123' },
  });
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: confirmation },
  });
}
beforeEach(() => {
  api.fetch.mockReset();
  api.fetch.mockResolvedValue(response({ status: true }));
});
afterEach(() => {
  window.history.replaceState(null, '', '/');
});
afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('a reset token is cleared from the URL and submitted only with matching passwords', async () => {
  localStorage.setItem('cosmoids-game-state', 'guest-save');
  await openReset();
  expect(window.location.hash).toBe('');
  fillPassword('different-password-456');
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/don’t match/);
  expect(api.fetch).not.toHaveBeenCalled();
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(
    await screen.findByRole('heading', { name: 'Password updated' })
  ).toBeInTheDocument();
  const [url, options] = api.fetch.mock.calls[0];
  expect(String(url)).toBe('http://localhost:3001/api/auth/reset-password');
  expect(JSON.parse(options.body)).toEqual({
    token: 'controlled-reset-token',
    newPassword: 'replacement-password-123',
  });
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  expect(localStorage.getItem('cosmoids-game-state')).toBe('guest-save');
});

test('an invalid or spent token offers a new link without replaying the password change', async () => {
  api.fetch.mockResolvedValueOnce(response({ code: 'INVALID_TOKEN' }, 400));
  await openReset();
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /expired, or has already been used/
  );
  expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
  expect(api.fetch).toHaveBeenCalledOnce();
});

test('a missing token shows recovery instead of a password form', async () => {
  await openReset('');
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
  expect(api.fetch).not.toHaveBeenCalled();
});

test('opening a new email link in the same tab replaces the recovery form', async () => {
  await openReset('');
  window.history.replaceState(null, '', '/reset-password#token=new-link-token');
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(await screen.findByLabelText('New password')).toBeEnabled();
  expect(window.location.hash).toBe('');
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  await screen.findByRole('heading', { name: 'Password updated' });
  expect(JSON.parse(api.fetch.mock.calls[0][1].body).token).toBe(
    'new-link-token'
  );
});

test('a late response for an earlier link cannot complete a newly opened link', async () => {
  let resolveOld!: (value: Response) => void;
  api.fetch.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      resolveOld = resolve;
    })
  );
  await openReset();
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  await waitFor(() => expect(api.fetch).toHaveBeenCalledOnce());
  window.history.replaceState(
    null,
    '',
    '/reset-password#token=second-link-token'
  );
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(screen.getByLabelText('New password')).toHaveValue('');
  await act(async () => {
    resolveOld(response({ status: true }));
  });
  expect(
    screen.queryByRole('heading', { name: 'Password updated' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled();
});

test('rate limits and failed responses retain the form for an explicit retry', async () => {
  api.fetch.mockResolvedValueOnce(response({ code: 'TOO_MANY_REQUESTS' }, 429));
  await openReset();
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Too many attempts/
  );
  expect(screen.getByLabelText('New password')).toBeEnabled();
  expect(screen.queryByText('Password updated')).not.toBeInTheDocument();
  expect(api.fetch).toHaveBeenCalledOnce();
});

test('an ambiguous network outcome never reports success or retries automatically', async () => {
  api.fetch.mockRejectedValue(new TypeError('offline'));
  await openReset();
  fillPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /couldn’t confirm the password change/
  );
  expect(api.fetch).toHaveBeenCalledOnce();
  expect(screen.getByRole('link', { name: 'Return to game' })).toHaveAttribute(
    'href',
    '/'
  );
});
