import ky, { type KyInstance } from 'ky';
import { getOrCreateInstallId } from './installId';
import { secureStorage } from './storage';
import { useSession } from './session.store';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;
  constructor(code: string, status: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export function unwrapEnvelope<T>(body: any): T {
  if (body && 'error' in body) {
    throw new ApiError(body.error.code, body.error.status ?? 400, body.error.message, body.error.details, body.error.requestId);
  }
  return body.data as T;
}

const REFRESH_TOKEN_KEY = 'gc_refresh_token';
const REFRESH_TIMEOUT_MS = 10_000;
// Upper bound for restoring a session at launch, so an unreachable server can never leave the app on the splash screen.
const RESTORE_TIMEOUT_MS = 12_000;
let refreshPromise: Promise<string> | null = null;

async function doRefresh(baseUrl: string): Promise<string> {
  const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new ApiError('AUTH_REFRESH_INVALID', 401, 'Please sign in again.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json();
  if (!res.ok) throw new ApiError(body.error?.code ?? 'AUTH_REFRESH_INVALID', res.status, body.error?.message ?? 'Please sign in again.');
  await secureStorage.set(REFRESH_TOKEN_KEY, body.data.refreshToken);
  const current = useSession.getState();
  useSession.getState().setSession({
    accessToken: body.data.accessToken,
    userId: current.userId ?? '',
    role: current.role ?? 'parent',
    profileId: current.profileId,
  });
  return body.data.accessToken as string;
}

export async function persistRefreshToken(token: string) {
  await secureStorage.set(REFRESH_TOKEN_KEY, token);
}

export async function readRefreshToken() {
  return secureStorage.get(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken() {
  await secureStorage.delete(REFRESH_TOKEN_KEY);
}

function buildClient(baseUrl: string): KyInstance {
  return ky.create({
    baseUrl,
    timeout: 15000,
    retry: { limit: 2, methods: ['get'] },
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          const installId = await getOrCreateInstallId();
          request.headers.set('X-Install-Id', installId);
          request.headers.set('X-Platform', 'android');
          request.headers.set('X-App-Version', '1.0.0');
          const token = useSession.getState().accessToken;
          if (token && !request.headers.has('Authorization')) request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
      afterResponse: [
        async ({ request, response, retryCount }) => {
          if (response.status !== 401 || retryCount > 0) return;
          const body = await response.clone().json().catch(() => null);
          if (body?.error?.code !== 'AUTH_TOKEN_EXPIRED') return;
          refreshPromise ??= doRefresh(baseUrl).finally(() => {
            refreshPromise = null;
          });
          const newToken = await refreshPromise.catch(() => null);
          if (!newToken) return;
          const headers = new Headers(request.headers);
          headers.set('Authorization', `Bearer ${newToken}`);
          return ky.retry({ request: new Request(request, { headers }) });
        },
      ],
    },
  });
}

// ky's `baseUrl` resolves relative paths using standard URL rules: without a
// trailing slash, the last path segment (e.g. "app") is treated as a file and
// gets replaced rather than appended to. Always normalize so "bootstrap"
// resolves under .../api/v1/app/, not .../api/v1/.
function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export const API_BASE_URL = withTrailingSlash(process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1/app');
const baseUrl = API_BASE_URL;
const client = buildClient(baseUrl);

// Non-2xx responses carry the backend's { error } envelope. ky would throw its
// own HTTPError for those (hiding codes like REGISTRATION_REQUIRED or
// OTP_INVALID), so read the body ourselves and raise ApiError instead.
async function sendRaw<T, M = Record<string, unknown>>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options: Record<string, unknown> = {},
): Promise<{ data: T; meta: M }> {
  const res = await client(url, { method, throwHttpErrors: false, ...options });
  const body: any = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    const err = body?.error;
    throw new ApiError(err?.code ?? 'HTTP_ERROR', res.status, err?.message ?? `Request failed (${res.status})`, err?.details, err?.requestId);
  }
  return { data: body?.data as T, meta: (body?.meta ?? {}) as M };
}

async function send<T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, options: Record<string, unknown> = {}): Promise<T> {
  return (await sendRaw<T>(method, url, options)).data;
}

export const api = {
  get: <T>(url: string, opts?: { searchParams?: Record<string, string | undefined>; token?: string }) => {
    const searchParams = Object.fromEntries(Object.entries(opts?.searchParams ?? {}).filter(([, v]) => v !== undefined && v !== ''));
    return send<T>('get', url, {
      searchParams,
      headers: opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
  },
  post: <T>(url: string, json?: unknown, opts?: { token?: string; idempotencyKey?: string }) => {
    const headers: Record<string, string> = {};
    if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;
    if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    return send<T>('post', url, { json, headers });
  },
  put: <T>(url: string, json?: unknown) => send<T>('put', url, { json }),
  patch: <T>(url: string, json?: unknown, opts?: { ifMatch?: string }) =>
    send<T>('patch', url, { json, headers: opts?.ifMatch ? { 'If-Match': opts.ifMatch } : undefined }),
  delete: <T>(url: string) => send<T>('delete', url),
  getWithMeta: <T, M = Record<string, unknown>>(url: string, opts?: { searchParams?: Record<string, string | undefined> }) =>
    sendRaw<T, M>('get', url, {
      searchParams: Object.fromEntries(Object.entries(opts?.searchParams ?? {}).filter(([, v]) => v !== undefined && v !== '')),
    }),
  // Same as post/patch, but also returns the envelope's `meta` (e.g. recommendationsPreview).
  postWithMeta: <T, M = Record<string, unknown>>(url: string, json?: unknown, opts?: { idempotencyKey?: string }) =>
    sendRaw<T, M>('post', url, { json, headers: opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined }),
  patchWithMeta: <T, M = Record<string, unknown>>(url: string, json?: unknown, opts?: { ifMatch?: string }) =>
    sendRaw<T, M>('patch', url, { json, headers: opts?.ifMatch ? { 'If-Match': opts.ifMatch } : undefined }),
};

export type RestoreResult = 'ok' | 'signed_out' | 'offline';

// On a cold start the access token (memory only) is gone but the refresh token
// is still in secure storage: trade it for a new access token and load who the
// user is, so the rest of the app can make authenticated calls.
export async function restoreSession(): Promise<RestoreResult> {
  if (!(await secureStorage.get(REFRESH_TOKEN_KEY))) return 'signed_out';
  return Promise.race([
    restoreWithServer(),
    new Promise<RestoreResult>((resolve) => setTimeout(() => resolve('offline'), RESTORE_TIMEOUT_MS)),
  ]);
}

async function restoreWithServer(): Promise<RestoreResult> {
  try {
    const accessToken = await doRefresh(baseUrl);
    const me = await api.get<{ userId: string; role: 'parent' | 'student' | 'teacher' | 'institute_staff'; profileId: string | null }>('me');
    useSession.getState().setSession({ accessToken, userId: me.userId, role: me.role, profileId: me.profileId });
    return 'ok';
  } catch (err) {
    if (err instanceof ApiError) {
      await secureStorage.delete(REFRESH_TOKEN_KEY);
      useSession.getState().clear();
      return 'signed_out';
    }
    return 'offline';
  }
}
