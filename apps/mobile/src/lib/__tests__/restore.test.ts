jest.mock('../storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), delete: jest.fn() },
  kv: { getString: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock('../installId', () => ({ getOrCreateInstallId: async () => 'test-install-id' }));

import { restoreSession } from '../api';
import { useSession } from '../session.store';
// This import resolves to the mock above (jest.mock replaces the module), so it's
// the same object api.ts sees — no separate variable for the mock factory to close over.
import { secureStorage } from '../storage';

const mockGet = secureStorage.get as jest.Mock;
const mockSet = secureStorage.set as jest.Mock;
const mockDelete = secureStorage.delete as jest.Mock;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  jest.useRealTimers();
  mockGet.mockReset();
  mockSet.mockReset();
  mockDelete.mockReset();
  useSession.getState().clear();
});

describe('restoreSession', () => {
  it('is signed_out when there is no saved login', async () => {
    mockGet.mockResolvedValue(null);
    await expect(restoreSession()).resolves.toBe('signed_out');
  });

  it('restores the session and asks the refresh endpoint without a double slash', async () => {
    mockGet.mockResolvedValue('saved-refresh-token');
    const calls: string[] = [];
    (globalThis as any).fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      calls.push(url);
      if (url.endsWith('/auth/refresh')) return json(200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 } });
      return json(200, { data: { userId: 'u1', role: 'parent', profileId: 'p1' } });
    });

    await expect(restoreSession()).resolves.toBe('ok');
    expect(calls[0]).toMatch(/\/api\/v1\/app\/auth\/refresh$/);
    expect(calls[0]).not.toMatch(/app\/\/auth/);
    expect(useSession.getState()).toMatchObject({ accessToken: 'new-access', userId: 'u1', role: 'parent' });
    expect(mockSet).toHaveBeenCalledWith('gc_refresh_token', 'new-refresh');
  });

  it('is signed_out, and forgets the token, when the server rejects it', async () => {
    mockGet.mockResolvedValue('revoked');
    (globalThis as any).fetch = jest.fn(async () => json(401, { error: { code: 'AUTH_REFRESH_INVALID', message: 'Your session ended.' } }));
    await expect(restoreSession()).resolves.toBe('signed_out');
    expect(mockDelete).toHaveBeenCalledWith('gc_refresh_token');
  });

  it('gives up as offline instead of hanging when the server never answers', async () => {
    jest.useFakeTimers();
    mockGet.mockResolvedValue('saved-refresh-token');
    (globalThis as any).fetch = jest.fn(() => new Promise(() => {}));
    const result = restoreSession();
    await jest.advanceTimersByTimeAsync(13_000);
    await expect(result).resolves.toBe('offline');
  });
});
