import { api, ApiError } from '../api';

jest.mock('../installId', () => ({ getOrCreateInstallId: async () => 'test-install-id' }));

function mockFetchOnce(status: number, body: unknown) {
  (globalThis as any).fetch = jest.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

describe('api client', () => {
  it('returns data from a success envelope', async () => {
    mockFetchOnce(200, { data: { ok: true } });
    await expect(api.get('bootstrap')).resolves.toEqual({ ok: true });
  });

  it('raises ApiError with the backend code and details on a 409', async () => {
    mockFetchOnce(409, {
      error: { code: 'REGISTRATION_REQUIRED', message: 'Verified', details: { registrationToken: 'tok' }, requestId: 'r1' },
    });
    const err: any = await api.post('auth/otp/verify', { challengeId: 'c', code: '123456' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('REGISTRATION_REQUIRED');
    expect(err.status).toBe(409);
    expect(err.details).toEqual({ registrationToken: 'tok' });
  });

  it('raises ApiError with attemptsLeft details on OTP_INVALID', async () => {
    mockFetchOnce(422, { error: { code: 'OTP_INVALID', message: 'That code is incorrect.', details: { attemptsLeft: 4 } } });
    const err: any = await api.post('auth/otp/verify', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('OTP_INVALID');
    expect(err.details).toEqual({ attemptsLeft: 4 });
  });
});
