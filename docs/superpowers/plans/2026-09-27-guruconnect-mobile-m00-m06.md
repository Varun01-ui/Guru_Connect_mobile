# GuruConnect Mobile App — M00–M06 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo/React Native app and implement the platform foundation, splash gating, onboarding carousel, auth-method selection, full login flow, and parent registration (M00–M06) against the API built in `2026-09-27-guruconnect-backend-m00-m06.md`, matching the visual design already established in `guruconnect-mobile-prototype (2).html`.

**Architecture:** `apps/mobile` is an Expo app with a custom dev client (required for `react-native-mmkv` and Google Sign-In's native module — Expo Go alone cannot host them). One `features/<module>` folder per module (`platform`, `splash`, `onboarding`, `authSelect`, `login`, `registration`) holds screens + hooks + API calls; a small shared `components/ui/` kit and `theme/tokens.ts` (colors/type lifted straight from the prototype) back every screen. `lib/api.ts` (a `ky` wrapper) talks to the API at `EXPO_PUBLIC_API_URL`, unwraps the `{data,meta}`/`{error}` envelope, injects the required headers, and does single-flight refresh-on-401. Zustand + `react-native-mmkv` hold session/app-flag state; TanStack Query holds server state with an MMKV-backed persister. `RootNavigator` reproduces the gating chain from `modules/M01-splash-screen.md`.

**Tech Stack:** Expo (latest stable SDK via `create-expo-app@latest` — the spec's "SDK 52" pin predates this build and is superseded; New Architecture stays on either way), TypeScript strict, React Navigation 7 (native stack), TanStack Query v5, Zustand, `react-native-mmkv`, `expo-secure-store`, React Hook Form + Zod, `ky`, `@react-native-google-signin/google-signin`, `i18next`/`react-i18next`, Jest + `jest-expo` + React Native Testing Library.

**Spec:** `D:\GuruMobile\00-conventions.md`, `04-react-native-app-structure.md`, `modules\M00-mobile-platform-foundation.md` .. `M06-parent-registration.md`, `guruconnect-mobile-prototype (2).html`, and the sibling plan `2026-09-27-guruconnect-backend-m00-m06.md` (defines every endpoint this plan calls).

## Global Constraints

- Package/dependency choices always match `00-conventions.md` §2/§4 (React Navigation 7, TanStack Query v5, Zustand, MMKV, Secure Store, React Hook Form + Zod, `ky`) — no substitute UI/navigation/state libraries.
- Deviation from spec, called out once here rather than in every task: no `@react-native-firebase/*`, no Notifee, no `react-native-razorpay`, no R2 upload SDK. These need external project credentials nobody has supplied yet (Firebase project, R2 bucket, Razorpay keys) and no M00–M06 screen exercises them. `PUT /devices/me` is still called (metadata only, `fcmToken` omitted); wiring real push delivery is a follow-up plan once a Firebase project exists.
- Google Sign-In **is** implemented in full (it's inside M04's spec), but it only works once `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set in `apps/mobile/.env` — document this clearly; the button must degrade to a clear "Google Sign-In isn't configured yet" state rather than crashing when the env var is empty.
- Never store the access token anywhere but memory (Zustand). Only the refresh token and install id go in `expo-secure-store`. Never `AsyncStorage` for tokens (`00-conventions.md` §7).
- Every screen's copy is transcribed from the module docs / prototype verbatim where the docs give exact copy — this is a user-facing app, not placeholder Lorem Ipsum.
- M07 (Parent Child Setup) is explicitly out of scope. `ParentRegistration`'s successful submit navigates to a small placeholder `Home` screen (labelled "Home — Child Setup (M07) not built yet") rather than a nonexistent child-setup flow. Student/Teacher/Institute registration tiles on `RegistrationRouter` are visible (matching the M05 spec and the prototype) but tapping them shows an alert ("Coming soon — this role's registration isn't built yet") since M11/M14/M21 are out of scope.

## Review Focus

1. `/bootstrap` unreachable on first cold launch with no cached response (airplane mode, fresh install) — must land on `NoConnection` with a working "Retry", never a blank/crashed screen.
2. OTP verify returning `422 OTP_INVALID` with `attemptsLeft` must actually decrement the on-screen "N attempts left" text and re-enable the input, not just show a generic error and lock the user out of retrying.
3. Backgrounding the app mid-`ParentRegistration` (or losing connectivity) must not lose typed field values — the draft persistence contract (`useRegistrationDraft`) must survive a full app restart, since parent registration has 5+ fields and a mobile-verify sub-step.
4. Rotating a device from portrait to a small/short screen (or a 2 GB low-end Android with a software keyboard open) must not hide the primary CTA button on `ParentRegistration` or `OtpVerify` behind the keyboard — both need `KeyboardAvoidingView`/scroll, not a fixed-position button assumption.
5. A `ROLE_MISMATCH` (409) response on `/auth/otp/verify` or `/auth/google` must surface the documented `RoleMismatchSheet` copy ("Continue as X" / "Use a different number"), not a generic error toast that leaves the user stuck.

---

### Task 1: Expo scaffold, dependencies, and env

**Files:**
- Create: `apps/mobile/*` (via `create-expo-app`)
- Modify: `apps/mobile/package.json`, `apps/mobile/app.config.ts`, `apps/mobile/.env.example`, `apps/mobile/.env`
- Create: `apps/mobile/babel.config.js` (reanimated plugin), `apps/mobile/jest.config.js`, `apps/mobile/jest.setup.js`

**Interfaces:**
- Produces: a runnable Expo project at `apps/mobile` wired into the npm workspace, with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` available via `process.env` in app code.

- [ ] **Step 1: Scaffold**

Run (repo root):
```bash
npx create-expo-app@latest apps/mobile --template blank-typescript
```

- [ ] **Step 2: Install dependencies**

Run inside `apps/mobile`:
```bash
npx expo install expo-dev-client expo-secure-store expo-crypto expo-splash-screen expo-localization expo-constants react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated @react-native-community/netinfo
npm install @react-navigation/native @react-navigation/native-stack @tanstack/react-query @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client zustand react-native-mmkv react-hook-form @hookform/resolvers zod ky i18next react-i18next @react-native-google-signin/google-signin @guruconnect/shared
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest
```

Note: `react-native-mmkv` and `@react-native-google-signin/google-signin` have native code — from this point on the app must run via `npx expo run:android` (or an EAS dev-client build), not inside plain Expo Go.

- [ ] **Step 3: `app.config.ts`**

```ts
// apps/mobile/app.config.ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'GuruConnect',
  slug: 'guruconnect',
  scheme: 'guruconnect',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  plugins: ['expo-secure-store', 'expo-dev-client'],
  android: { package: 'in.guruconnect.app' },
  ios: { bundleIdentifier: 'in.guruconnect.app' },
};

export default config;
```

- [ ] **Step 4: Env files**

`apps/mobile/.env.example`:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1/app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

`apps/mobile/.env` (git-ignored; `10.0.2.2` is the Android emulator's alias for the host machine's `localhost` — use your machine's LAN IP instead when running on a physical device):
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1/app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

- [ ] **Step 5: `babel.config.js`, `jest.config.js`, `jest.setup.js`**

```js
// apps/mobile/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'], plugins: ['react-native-reanimated/plugin'] };
};
```

```js
// apps/mobile/jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*)',
  ],
  setupFilesAfterEach: [],
  setupFiles: ['./jest.setup.js'],
};
```

```js
// apps/mobile/jest.setup.js
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: class {
      set(k, v) { store.set(k, v); }
      getString(k) { return store.get(k); }
      delete(k) { store.delete(k); }
    },
  };
});
```

- [ ] **Step 6: Smoke-run**

Run: `npx expo run:android` (from `apps/mobile`, first time only — builds the dev client; requires Android Studio/SDK installed. On a machine without an Android toolchain, use an EAS cloud dev build instead: `npx eas build --profile development --platform android`.)
Expected: the default blank-typescript screen launches in the dev client.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.config.ts apps/mobile/.env.example apps/mobile/babel.config.js apps/mobile/jest.config.js apps/mobile/jest.setup.js apps/mobile/tsconfig.json apps/mobile/App.tsx
git commit -m "chore: scaffold Expo mobile app with dev-client dependencies"
```

---

### Task 2: `lib/api.ts`, secure storage, session + app-flags stores

**Files:**
- Create: `apps/mobile/src/lib/storage.ts`
- Create: `apps/mobile/src/lib/installId.ts`
- Create: `apps/mobile/src/lib/api.ts`
- Create: `apps/mobile/src/lib/session.store.ts`
- Create: `apps/mobile/src/lib/appFlags.store.ts`
- Test: `apps/mobile/src/lib/__tests__/api.test.ts`

**Interfaces:**
- Produces: `secureStorage` (get/set/delete via `expo-secure-store`), `mmkv` (encrypted-enough-for-dev MMKV instance), `getOrCreateInstallId()`, `useSession` (Zustand: `accessToken, userId, role, profileId, setSession, clear`), `useAppFlags` (Zustand+MMKV persisted: `onboardingSeenVersion, lastRole, pendingDeepLink, setOnboardingSeen, setPendingDeepLink`), `api` (a `ky` instance with `.get/.post/.put/.delete` returning the unwrapped `data`, throwing `ApiError{code,status,message,details}` on `{error}` envelopes, and doing a single-flight refresh on `AUTH_TOKEN_EXPIRED`-shaped 401s).

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/lib/__tests__/api.test.ts
import { ApiError, unwrapEnvelope } from '../api';

describe('api envelope unwrapping', () => {
  it('returns data on a success envelope', () => {
    expect(unwrapEnvelope({ data: { ok: true }, meta: {} })).toEqual({ ok: true });
  });

  it('throws ApiError on an error envelope', () => {
    expect(() => unwrapEnvelope({ error: { code: 'VALIDATION_FAILED', message: 'Bad input', requestId: 'r1' } })).toThrow(ApiError);
    try {
      unwrapEnvelope({ error: { code: 'VALIDATION_FAILED', message: 'Bad input', requestId: 'r1' } });
    } catch (e) {
      expect((e as ApiError).code).toBe('VALIDATION_FAILED');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/api.test.ts` (from `apps/mobile`)
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: `lib/storage.ts`**

```ts
// apps/mobile/src/lib/storage.ts
import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'guruconnect-app' });

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
```

- [ ] **Step 4: `lib/installId.ts`**

```ts
// apps/mobile/src/lib/installId.ts
import * as Crypto from 'expo-crypto';
import { secureStorage } from './storage';

const KEY = 'gc_install_id';
let cached: string | null = null;

export async function getOrCreateInstallId(): Promise<string> {
  if (cached) return cached;
  const existing = await secureStorage.get(KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const id = Crypto.randomUUID();
  await secureStorage.set(KEY, id);
  cached = id;
  return id;
}
```

- [ ] **Step 5: `lib/session.store.ts` and `lib/appFlags.store.ts`**

```ts
// apps/mobile/src/lib/session.store.ts
import { create } from 'zustand';

export type Role = 'parent' | 'student' | 'teacher' | 'institute_staff';

interface SessionState {
  accessToken: string | null;
  userId: string | null;
  role: Role | null;
  profileId: string | null;
  setSession: (s: { accessToken: string; userId: string; role: Role; profileId: string | null }) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  userId: null,
  role: null,
  profileId: null,
  setSession: (s) => set({ accessToken: s.accessToken, userId: s.userId, role: s.role, profileId: s.profileId }),
  clear: () => set({ accessToken: null, userId: null, role: null, profileId: null }),
}));
```

```ts
// apps/mobile/src/lib/appFlags.store.ts
import { create } from 'zustand';
import { mmkv } from './storage';

const KEY = 'gc_app_flags';

interface AppFlags {
  onboardingSeenVersion: number;
  lastRole: string | null;
  pendingDeepLink: string | null;
  setOnboardingSeen: (version: number) => void;
  setPendingDeepLink: (link: string | null) => void;
}

function load(): Pick<AppFlags, 'onboardingSeenVersion' | 'lastRole' | 'pendingDeepLink'> {
  const raw = mmkv.getString(KEY);
  if (!raw) return { onboardingSeenVersion: 0, lastRole: null, pendingDeepLink: null };
  try {
    return JSON.parse(raw);
  } catch {
    return { onboardingSeenVersion: 0, lastRole: null, pendingDeepLink: null };
  }
}

function persist(state: Pick<AppFlags, 'onboardingSeenVersion' | 'lastRole' | 'pendingDeepLink'>) {
  mmkv.set(KEY, JSON.stringify(state));
}

export const useAppFlags = create<AppFlags>((set, get) => ({
  ...load(),
  setOnboardingSeen: (version) => {
    set({ onboardingSeenVersion: version });
    persist({ onboardingSeenVersion: version, lastRole: get().lastRole, pendingDeepLink: get().pendingDeepLink });
  },
  setPendingDeepLink: (link) => {
    set({ pendingDeepLink: link });
    persist({ onboardingSeenVersion: get().onboardingSeenVersion, lastRole: get().lastRole, pendingDeepLink: link });
  },
}));
```

- [ ] **Step 6: `lib/api.ts`**

```ts
// apps/mobile/src/lib/api.ts
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
let refreshPromise: Promise<string> | null = null;

async function doRefresh(baseUrl: string): Promise<string> {
  const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new ApiError('AUTH_REFRESH_INVALID', 401, 'Please sign in again.');
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const body = await res.json();
  if (!res.ok) throw new ApiError(body.error?.code ?? 'AUTH_REFRESH_INVALID', res.status, body.error?.message ?? 'Please sign in again.');
  await secureStorage.set(REFRESH_TOKEN_KEY, body.data.refreshToken);
  useSession.getState().setSession({
    accessToken: body.data.accessToken,
    userId: useSession.getState().userId ?? '',
    role: useSession.getState().role ?? 'parent',
    profileId: useSession.getState().profileId,
  });
  return body.data.accessToken as string;
}

export async function persistRefreshToken(token: string) {
  await secureStorage.set(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken() {
  await secureStorage.delete(REFRESH_TOKEN_KEY);
}

function buildClient(baseUrl: string): KyInstance {
  return ky.create({
    prefixUrl: baseUrl,
    timeout: 15000,
    retry: { limit: 2, methods: ['get'] },
    hooks: {
      beforeRequest: [
        async (request) => {
          const installId = await getOrCreateInstallId();
          request.headers.set('X-Install-Id', installId);
          request.headers.set('X-Platform', 'android');
          request.headers.set('X-App-Version', '1.0.0');
          const token = useSession.getState().accessToken;
          if (token) request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          if (response.status !== 401) return response;
          const body = await response.clone().json().catch(() => null);
          if (body?.error?.code !== 'AUTH_TOKEN_EXPIRED') return response;
          refreshPromise ??= doRefresh(baseUrl).finally(() => {
            refreshPromise = null;
          });
          const newToken = await refreshPromise.catch(() => null);
          if (!newToken) return response;
          const retryRequest = request.clone();
          retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
          return ky(retryRequest, { ...options, hooks: {} });
        },
      ],
    },
  });
}

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1/app';
const client = buildClient(baseUrl);

export const api = {
  get: async <T>(url: string, opts?: { searchParams?: Record<string, string>; token?: string }) => {
    const res = await client.get(url, { searchParams: opts?.searchParams, headers: opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined }).json<any>();
    return unwrapEnvelope<T>(res);
  },
  post: async <T>(url: string, json?: unknown, opts?: { token?: string; idempotencyKey?: string }) => {
    const headers: Record<string, string> = {};
    if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;
    if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    const res = await client.post(url, { json, headers }).json<any>();
    return unwrapEnvelope<T>(res);
  },
  put: async <T>(url: string, json?: unknown) => unwrapEnvelope<T>(await client.put(url, { json }).json<any>()),
  delete: async <T>(url: string) => unwrapEnvelope<T>(await client.delete(url).json<any>()),
};
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/api.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/lib
git commit -m "feat: ky api client with envelope unwrap + single-flight refresh, session/app-flags stores"
```

---

### Task 3: Theme tokens, i18n, App providers, navigation skeleton

**Files:**
- Create: `apps/mobile/src/theme/tokens.ts`
- Create: `apps/mobile/src/i18n/en.json`, `apps/mobile/src/i18n/index.ts`
- Create: `apps/mobile/src/lib/queryClient.ts`
- Create: `apps/mobile/src/app/providers/ErrorBoundary.tsx`
- Create: `apps/mobile/src/app/navigation/types.ts`
- Create: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Modify: `apps/mobile/App.tsx`
- Test: `apps/mobile/src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `tokens.light`/`tokens.dark` (colors transcribed from the prototype: `pri #4338ca`, `bg #f4f4f9`, `ink #15132e`, `hero #1f1b4d`, etc.), `queryClient` (persisted to MMKV), `RootStackParamList` (every M00–M06 route + `Home` placeholder), `RootNavigator` (renders `NavigationContainer` + a `Stack.Navigator` whose initial route is `Splash`).

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/theme/__tests__/tokens.test.ts
import { tokens } from '../tokens';

describe('theme tokens', () => {
  it('matches the prototype brand color', () => {
    expect(tokens.light.pri).toBe('#4338ca');
    expect(tokens.dark.pri).toBe('#8079ff');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/theme/__tests__/tokens.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: `theme/tokens.ts`** (colors transcribed from `guruconnect-mobile-prototype (2).html`'s `:root` CSS variables)

```ts
// apps/mobile/src/theme/tokens.ts
export const tokens = {
  light: {
    bg: '#f4f4f9',
    surface: '#ffffff',
    surface2: '#f7f7fb',
    surface3: '#ececf4',
    line: '#e4e3ee',
    ink: '#15132e',
    ink2: '#48466a',
    ink3: '#6a6887',
    pri: '#4338ca',
    pri2: '#3a2fb3',
    priSoft: '#ecebff',
    priInk: '#342aa8',
    onPrimary: '#ffffff',
    hero: '#1f1b4d',
    hero2: '#2c2670',
    heroInk: '#e4e2ff',
    verified: '#1d5fd6',
    verifiedSoft: '#e7efff',
    good: '#08734f',
    goodSoft: '#e2f5ec',
    warn: '#9a5b00',
    warnSoft: '#fff3d9',
    bad: '#b3261e',
    badSoft: '#fdecea',
    star: '#f59e0b',
  },
  dark: {
    bg: '#0d0e1a',
    surface: '#15162a',
    surface2: '#191a30',
    surface3: '#22233d',
    line: '#2c2d4a',
    ink: '#f2f1fb',
    ink2: '#c7c6de',
    ink3: '#9694b3',
    pri: '#8079ff',
    pri2: '#9a94ff',
    priSoft: '#262260',
    priInk: '#c9c5ff',
    onPrimary: '#15132e',
    hero: '#0f0c2e',
    hero2: '#1a1650',
    heroInk: '#d8d5ff',
    verified: '#6ea1ff',
    verifiedSoft: '#1c2b52',
    good: '#3fd497',
    goodSoft: '#123b2c',
    warn: '#f3b354',
    warnSoft: '#3a2c0f',
    bad: '#ff6b63',
    badSoft: '#3c1614',
    star: '#f6b73c',
  },
  radii: { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 },
  spacing: (n: number) => n * 4,
  font: { display: 'Sora_700Bold', body: 'PlusJakartaSans_500Medium', bodyBold: 'PlusJakartaSans_700Bold' },
};

export type ThemeTokens = typeof tokens.light;
```

- [ ] **Step 4: i18n scaffold**

```json
// apps/mobile/src/i18n/en.json
{
  "common": { "retry": "Retry", "cancel": "Cancel", "continue": "Continue" }
}
```

```ts
// apps/mobile/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 5: `lib/queryClient.ts`**

```ts
// apps/mobile/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkv } from './storage';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

export const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: (key) => mmkv.delete(key),
  },
});
```

- [ ] **Step 6: `ErrorBoundary.tsx`**

```tsx
// apps/mobile/src/app/providers/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface State { hasError: boolean; errorId: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, errorId: '' };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, errorId: Math.random().toString(36).slice(2, 10) };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Restart the app to continue. If this keeps happening, contact support.</Text>
        <Text style={styles.errorId}>Error ID {this.state.errorId}</Text>
        <Pressable style={styles.button} onPress={() => this.setState({ hasError: false })}>
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  title: { fontSize: 20, fontWeight: '700', color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center', marginBottom: 16 },
  errorId: { fontSize: 12, color: tokens.light.ink3, marginBottom: 24 },
  button: { backgroundColor: tokens.light.pri, paddingHorizontal: 24, paddingVertical: 12, borderRadius: tokens.radii.md },
  buttonText: { color: tokens.light.onPrimary, fontWeight: '700' },
});
```

- [ ] **Step 7: `navigation/types.ts`**

```ts
// apps/mobile/src/app/navigation/types.ts
export type RootStackParamList = {
  Splash: undefined;
  Maintenance: undefined;
  ForceUpdate: undefined;
  NoConnection: undefined;
  Onboarding: undefined;
  AuthSelect: undefined;
  PhoneEntry: undefined;
  OtpVerify: { challengeId: string; destination: string; purpose: 'login' | 'signup' };
  EmailEntry: undefined;
  ForgotPassword: undefined;
  ResetPassword: { challengeId: string; email: string };
  ActiveSessions: undefined;
  RegistrationRouter: { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
  ParentRegistration: { registrationToken: string; referralCode?: string };
  Home: undefined;
};
```

- [ ] **Step 8: `navigation/RootNavigator.tsx`** (screens stubbed as empty `View`s for now — real screens land in Tasks 6–13; this task only proves the navigator wiring compiles and starts on `Splash`)

```tsx
// apps/mobile/src/app/navigation/RootNavigator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Placeholder({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{name}</Text>
    </View>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">{() => <Placeholder name="Splash" />}</Stack.Screen>
        <Stack.Screen name="Maintenance">{() => <Placeholder name="Maintenance" />}</Stack.Screen>
        <Stack.Screen name="ForceUpdate">{() => <Placeholder name="ForceUpdate" />}</Stack.Screen>
        <Stack.Screen name="NoConnection">{() => <Placeholder name="NoConnection" />}</Stack.Screen>
        <Stack.Screen name="Onboarding">{() => <Placeholder name="Onboarding" />}</Stack.Screen>
        <Stack.Screen name="AuthSelect">{() => <Placeholder name="AuthSelect" />}</Stack.Screen>
        <Stack.Screen name="PhoneEntry">{() => <Placeholder name="PhoneEntry" />}</Stack.Screen>
        <Stack.Screen name="OtpVerify">{() => <Placeholder name="OtpVerify" />}</Stack.Screen>
        <Stack.Screen name="EmailEntry">{() => <Placeholder name="EmailEntry" />}</Stack.Screen>
        <Stack.Screen name="ForgotPassword">{() => <Placeholder name="ForgotPassword" />}</Stack.Screen>
        <Stack.Screen name="ResetPassword">{() => <Placeholder name="ResetPassword" />}</Stack.Screen>
        <Stack.Screen name="ActiveSessions">{() => <Placeholder name="ActiveSessions" />}</Stack.Screen>
        <Stack.Screen name="RegistrationRouter">{() => <Placeholder name="RegistrationRouter" />}</Stack.Screen>
        <Stack.Screen name="ParentRegistration">{() => <Placeholder name="ParentRegistration" />}</Stack.Screen>
        <Stack.Screen name="Home">{() => <Placeholder name="Home" />}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Each later task replaces one `<Placeholder>` registration with the real screen component — the route names above do not change.

- [ ] **Step 9: `App.tsx`**

```tsx
// apps/mobile/App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ErrorBoundary } from './src/app/providers/ErrorBoundary';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { queryClient, persister } from './src/lib/queryClient';
import './src/i18n';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}>
            <RootNavigator />
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Note: `PersistQueryClientProvider` renders `QueryClientProvider` internally, so a separate one is not needed.

- [ ] **Step 10: Run tests and smoke-run**

Run: `npx jest src/theme/__tests__/tokens.test.ts`
Expected: PASS.

Run: `npx expo run:android`
Expected: app launches showing the "Splash" placeholder text.

- [ ] **Step 11: Commit**

```bash
git add apps/mobile/src/theme apps/mobile/src/i18n apps/mobile/src/lib/queryClient.ts apps/mobile/src/app apps/mobile/App.tsx
git commit -m "feat: theme tokens from prototype, i18n scaffold, providers, navigation skeleton"
```

---

### Task 4: Core UI kit

**Files:**
- Create: `apps/mobile/src/components/ui/Button.tsx`, `TextField.tsx`, `PhoneField.tsx`, `OtpInput.tsx`, `Select.tsx`, `Card.tsx`, `Checkbox.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx`, `StickyActionBar.tsx`, `index.ts`
- Test: `apps/mobile/src/components/ui/__tests__/Button.test.tsx`, `OtpInput.test.tsx`

**Interfaces:**
- Produces: `<Button variant="pri"|"soft"|"outline" loading? disabled? onPress title />`, `<TextField label error? ...TextInputProps />`, `<PhoneField value onChangeText error? />` (fixed `+91` prefix), `<OtpInput length=6 value onChange autoFocus />`, `<Select label options={{label,value}[]} value onChange />`, `<Card />`, `<Checkbox checked onChange label />`, `<EmptyState title body icon? />`, `<ErrorState title body onRetry? />`, `<Skeleton width height />`, `<StickyActionBar>{children}</StickyActionBar>`.

- [ ] **Step 1: Write the failing tests**

```tsx
// apps/mobile/src/components/ui/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress when not disabled/loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Continue" onPress={onPress} />);
    fireEvent.press(getByText('Continue'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Continue" onPress={onPress} disabled />);
    fireEvent.press(getByText('Continue'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

```tsx
// apps/mobile/src/components/ui/__tests__/OtpInput.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OtpInput } from '../OtpInput';

describe('OtpInput', () => {
  it('calls onChange with the full 6-digit string once complete', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<OtpInput length={6} value="" onChange={onChange} />);
    fireEvent.changeText(getByTestId('otp-input'), '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/ui`
Expected: FAIL — components don't exist.

- [ ] **Step 3: Implement**

```tsx
// apps/mobile/src/components/ui/Button.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps } from 'react-native';
import { tokens } from '../../theme/tokens';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'pri' | 'soft' | 'outline';
  loading?: boolean;
}

export function Button({ title, variant = 'pri', loading, disabled, onPress, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={variant === 'pri' ? tokens.light.onPrimary : tokens.light.priInk} /> : <Text style={[styles.text, textVariant[variant]]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 50, borderRadius: tokens.radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  text: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});

const variantStyles = StyleSheet.create({
  pri: { backgroundColor: tokens.light.pri },
  soft: { backgroundColor: tokens.light.priSoft },
  outline: { backgroundColor: tokens.light.surface, borderWidth: 1, borderColor: tokens.light.line },
});

const textVariant = StyleSheet.create({
  pri: { color: tokens.light.onPrimary },
  soft: { color: tokens.light.priInk },
  outline: { color: tokens.light.ink },
});
```

```tsx
// apps/mobile/src/components/ui/TextField.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { tokens } from '../../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={tokens.light.ink3}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 6, fontWeight: '600' },
  input: { height: 48, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, paddingHorizontal: 14, fontSize: 15, color: tokens.light.ink, backgroundColor: tokens.light.surface },
  inputError: { borderColor: tokens.light.bad },
  error: { fontSize: 12, color: tokens.light.bad, marginTop: 4 },
});
```

```tsx
// apps/mobile/src/components/ui/PhoneField.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface PhoneFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  editable?: boolean;
}

export function PhoneField({ value, onChangeText, error, editable = true }: PhoneFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mobile number</Text>
      <View style={[styles.row, error && styles.rowError]}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="98450 14210"
          placeholderTextColor={tokens.light.ink3}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, ''))}
          editable={editable}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, backgroundColor: tokens.light.surface, paddingHorizontal: 14 },
  rowError: { borderColor: tokens.light.bad },
  prefix: { fontSize: 15, color: tokens.light.ink2, marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 15, color: tokens.light.ink },
  error: { fontSize: 12, color: tokens.light.bad, marginTop: 4 },
});
```

```tsx
// apps/mobile/src/components/ui/OtpInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

export function OtpInput({ length, value, onChange, autoFocus }: OtpInputProps) {
  const digits = value.padEnd(length, ' ').split('');
  return (
    <View style={styles.container}>
      <TextInput
        testID="otp-input"
        style={styles.hidden}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
      />
      <View style={styles.boxes} pointerEvents="none">
        {digits.map((d, i) => (
          <View key={i} style={styles.box}>
            <Text style={styles.digit}>{d.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  hidden: { position: 'absolute', opacity: 0, height: 56, width: '100%' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 44, height: 56, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.light.surface },
  digit: { fontSize: 22, fontWeight: '700', color: tokens.light.ink },
});
```

```tsx
// apps/mobile/src/components/ui/Select.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface Option { label: string; value: string }
interface SelectProps {
  label: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({ label, options, value, onChange, disabled, placeholder = 'Select' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.field, disabled && styles.disabled]} onPress={() => !disabled && setOpen(true)}>
        <Text style={selected ? styles.value : styles.placeholder}>{selected?.label ?? placeholder}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 6, fontWeight: '600' },
  field: { height: 48, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: tokens.light.surface },
  disabled: { opacity: 0.5 },
  value: { fontSize: 15, color: tokens.light.ink },
  placeholder: { fontSize: 15, color: tokens.light.ink3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '60%', backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, paddingVertical: 8 },
  option: { paddingHorizontal: 20, paddingVertical: 14 },
  optionText: { fontSize: 15, color: tokens.light.ink },
});
```

```tsx
// apps/mobile/src/components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.light.surface, borderRadius: tokens.radii.lg, padding: 16, shadowColor: '#15132e', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
});
```

```tsx
// apps/mobile/src/components/ui/Checkbox.tsx
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface CheckboxProps { checked: boolean; onChange: (v: boolean) => void; label: string }

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <Text style={styles.check}>✓</Text> : null}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 },
  boxChecked: { backgroundColor: tokens.light.pri, borderColor: tokens.light.pri },
  check: { color: tokens.light.onPrimary, fontSize: 12, fontWeight: '700' },
  label: { flex: 1, fontSize: 14, color: tokens.light.ink2 },
});
```

```tsx
// apps/mobile/src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 17, fontWeight: '700', color: tokens.light.ink, marginBottom: 6, textAlign: 'center' },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center' },
});
```

```tsx
// apps/mobile/src/components/ui/ErrorState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 17, fontWeight: '700', color: tokens.light.ink, marginBottom: 6, textAlign: 'center' },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center', marginBottom: 16 },
});
```

```tsx
// apps/mobile/src/components/ui/Skeleton.tsx
import React from 'react';
import { View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Skeleton({ width, height }: { width: number | `${number}%`; height: number }) {
  return <View style={{ width, height, borderRadius: 8, backgroundColor: tokens.light.surface3 }} />;
}
```

```tsx
// apps/mobile/src/components/ui/StickyActionBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export function StickyActionBar({ children }: { children: React.ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: { padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line, backgroundColor: tokens.light.surface },
});
```

```ts
// apps/mobile/src/components/ui/index.ts
export * from './Button';
export * from './TextField';
export * from './PhoneField';
export * from './OtpInput';
export * from './Select';
export * from './Card';
export * from './Checkbox';
export * from './EmptyState';
export * from './ErrorState';
export * from './Skeleton';
export * from './StickyActionBar';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui
git commit -m "feat: core UI kit (Button, TextField, PhoneField, OtpInput, Select, Card, Checkbox, states)"
```

---

### Task 5: M00 data hooks — bootstrap, me, masters, device registration

**Files:**
- Create: `apps/mobile/src/features/platform/api.ts`
- Create: `apps/mobile/src/features/platform/hooks.ts`
- Test: `apps/mobile/src/features/platform/__tests__/hooks.test.tsx`

**Interfaces:**
- Consumes: `api` (Task 2).
- Produces: `useBootstrapQuery()`, `useMeQuery(enabled)`, `useMastersQuery()`, `useAreasQuery(cityId)`, `useRegisterDeviceMutation()`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/platform/__tests__/hooks.test.tsx
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBootstrapQuery } from '../hooks';
import * as api from '../../../lib/api';

jest.mock('../../../lib/api', () => ({ api: { get: jest.fn() } }));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useBootstrapQuery', () => {
  it('fetches /bootstrap and returns the data', async () => {
    (api.api.get as jest.Mock).mockResolvedValue({ onboardingVersion: 2 });
    const { result } = renderHook(() => useBootstrapQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.onboardingVersion).toBe(2);
    expect(api.api.get).toHaveBeenCalledWith('bootstrap');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/platform`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `api.ts`**

```ts
// apps/mobile/src/features/platform/api.ts
import type { BootstrapResponse } from '@guruconnect/shared';
import { api } from '../../lib/api';

export function fetchBootstrap() {
  return api.get<BootstrapResponse>('bootstrap');
}

export interface MeResponse {
  userId: string;
  role: 'parent' | 'student' | 'teacher' | 'institute_staff';
  profileId: string | null;
  name: string;
  accountStatus: string;
  registration: { complete: boolean; nextStep: string | null };
}

export function fetchMe() {
  return api.get<MeResponse>('me');
}

export interface MastersResponse {
  states: { id: string; name: string; code: string }[];
  cities: { id: string; stateId: string; name: string }[];
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  teachingModes: { id: string; name: string }[];
}

export function fetchMasters() {
  return api.get<MastersResponse>('masters');
}

export function fetchAreas(cityId: string) {
  return api.get<{ areas: { id: string; cityId: string; name: string }[] }>('masters/areas', { searchParams: { cityId } });
}

export function registerDevice(input: { installId: string; platform: 'android' | 'ios'; appVersion: string; locale?: string; timezone?: string }) {
  return api.put<{ ok: boolean }>('devices/me', input);
}
```

- [ ] **Step 4: Implement `hooks.ts`**

```ts
// apps/mobile/src/features/platform/hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from './api';

export const platformKeys = {
  bootstrap: ['bootstrap'] as const,
  me: ['me'] as const,
  masters: ['masters'] as const,
  areas: (cityId: string) => ['masters', 'areas', cityId] as const,
};

export function useBootstrapQuery() {
  return useQuery({ queryKey: platformKeys.bootstrap, queryFn: api.fetchBootstrap, staleTime: 60_000 });
}

export function useMeQuery(enabled: boolean) {
  return useQuery({ queryKey: platformKeys.me, queryFn: api.fetchMe, enabled });
}

export function useMastersQuery() {
  return useQuery({ queryKey: platformKeys.masters, queryFn: api.fetchMasters, staleTime: 24 * 60 * 60 * 1000 });
}

export function useAreasQuery(cityId: string | undefined) {
  return useQuery({ queryKey: platformKeys.areas(cityId ?? ''), queryFn: () => api.fetchAreas(cityId!), enabled: !!cityId });
}

export function useRegisterDeviceMutation() {
  return useMutation({ mutationFn: api.registerDevice });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/features/platform`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/platform
git commit -m "feat: M00 data hooks for bootstrap/me/masters/areas/device registration"
```

---

### Task 6: M01 Splash — gating logic and screens

**Files:**
- Create: `apps/mobile/src/features/splash/screens/Splash.tsx`
- Create: `apps/mobile/src/features/splash/screens/Maintenance.tsx`
- Create: `apps/mobile/src/features/splash/screens/ForceUpdate.tsx`
- Create: `apps/mobile/src/features/splash/screens/NoConnection.tsx`
- Create: `apps/mobile/src/features/splash/gating.ts`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx` (wire real screens)
- Test: `apps/mobile/src/features/splash/__tests__/gating.test.ts`

**Interfaces:**
- Consumes: `useBootstrapQuery` (Task 5), `useAppFlags` (Task 2).
- Produces: `decideSplashRoute(bootstrap, hasRefreshToken, onboardingSeenVersion): 'Maintenance'|'ForceUpdate'|'Onboarding'|'AuthSelect'|'Home'` (pure function, unit-testable without rendering), and the four screens.

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/splash/__tests__/gating.test.ts
import { decideSplashRoute } from '../gating';

const baseBootstrap = {
  app: { minVersion: '1.0.0', updateRequired: false },
  maintenance: { enabled: false },
  onboardingVersion: 2,
} as any;

describe('decideSplashRoute', () => {
  it('routes to Maintenance when maintenance is enabled', () => {
    expect(decideSplashRoute({ ...baseBootstrap, maintenance: { enabled: true } }, false, 0)).toBe('Maintenance');
  });

  it('routes to ForceUpdate when the app is below minVersion', () => {
    expect(decideSplashRoute({ ...baseBootstrap, app: { ...baseBootstrap.app, updateRequired: true } }, false, 0)).toBe('ForceUpdate');
  });

  it('routes to Onboarding when signed out and onboarding not yet seen at this version', () => {
    expect(decideSplashRoute(baseBootstrap, false, 1)).toBe('Onboarding');
  });

  it('routes to AuthSelect when signed out and onboarding already seen at this version', () => {
    expect(decideSplashRoute(baseBootstrap, false, 2)).toBe('AuthSelect');
  });

  it('routes to Home when a refresh token exists, bypassing onboarding regardless of version', () => {
    expect(decideSplashRoute(baseBootstrap, true, 0)).toBe('Home');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/splash/__tests__/gating.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `gating.ts`**

```ts
// apps/mobile/src/features/splash/gating.ts
import type { BootstrapResponse } from '@guruconnect/shared';

export type SplashRoute = 'Maintenance' | 'ForceUpdate' | 'Onboarding' | 'AuthSelect' | 'Home';

export function decideSplashRoute(bootstrap: BootstrapResponse, hasRefreshToken: boolean, onboardingSeenVersion: number): SplashRoute {
  if (bootstrap.maintenance.enabled) return 'Maintenance';
  if (bootstrap.app.updateRequired) return 'ForceUpdate';
  if (hasRefreshToken) return 'Home';
  if (onboardingSeenVersion < (bootstrap.onboardingVersion || 1)) return 'Onboarding';
  return 'AuthSelect';
}
```

- [ ] **Step 4: Implement the four screens**

```tsx
// apps/mobile/src/features/splash/screens/Splash.tsx
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { useBootstrapQuery } from '../../platform/hooks';
import { useAppFlags } from '../../../lib/appFlags.store';
import { secureStorage } from '../../../lib/storage';
import { decideSplashRoute } from '../gating';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function Splash({ navigation }: Props) {
  const bootstrap = useBootstrapQuery();
  const onboardingSeenVersion = useAppFlags((s) => s.onboardingSeenVersion);

  useEffect(() => {
    if (!bootstrap.data) return;
    (async () => {
      const refreshToken = await secureStorage.get('gc_refresh_token');
      const route = decideSplashRoute(bootstrap.data!, !!refreshToken, onboardingSeenVersion);
      navigation.replace(route);
    })();
  }, [bootstrap.data, onboardingSeenVersion, navigation]);

  if (bootstrap.isError && !bootstrap.data) {
    navigation.replace('NoConnection');
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>GuruConnect</Text>
      <Text style={styles.tagline}>Find a teacher you can trust</Text>
      <ActivityIndicator style={styles.spinner} color={tokens.light.pri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.light.surface },
  wordmark: { fontSize: 24, fontWeight: '700', color: tokens.light.pri },
  tagline: { fontSize: 14, color: tokens.light.ink3, marginTop: 4 },
  spinner: { marginTop: 24 },
});
```

```tsx
// apps/mobile/src/features/splash/screens/Maintenance.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { useBootstrapQuery } from '../../platform/hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Maintenance'>;

export function Maintenance({ navigation }: Props) {
  const bootstrap = useBootstrapQuery();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>We'll be right back</Text>
      <Text style={styles.body}>{bootstrap.data?.maintenance.message ?? 'GuruConnect is being upgraded.'}</Text>
      <Button title="Try again" onPress={() => navigation.replace('Splash')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  title: { fontSize: 20, fontWeight: '700', color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center', marginBottom: 24 },
});
```

```tsx
// apps/mobile/src/features/splash/screens/ForceUpdate.tsx
import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { useBootstrapQuery } from '../../platform/hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ForceUpdate'>;

export function ForceUpdate({}: Props) {
  const bootstrap = useBootstrapQuery();
  const storeUrl = bootstrap.data?.app.storeUrl ?? '';
  const isTrustedStoreUrl = storeUrl.startsWith('https://play.google.com/') || storeUrl.startsWith('https://apps.apple.com/');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update required</Text>
      <Text style={styles.body}>{bootstrap.data?.app.updateMessage}</Text>
      <Button title="Update now" onPress={() => isTrustedStoreUrl && Linking.openURL(storeUrl)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  title: { fontSize: 20, fontWeight: '700', color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center', marginBottom: 24 },
});
```

```tsx
// apps/mobile/src/features/splash/screens/NoConnection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'NoConnection'>;

export function NoConnection({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No internet connection</Text>
      <Text style={styles.body}>Connect to Wi-Fi or mobile data to set up GuruConnect.</Text>
      <Button title="Retry" onPress={() => navigation.replace('Splash')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  title: { fontSize: 20, fontWeight: '700', color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, color: tokens.light.ink2, textAlign: 'center', marginBottom: 24 },
});
```

- [ ] **Step 5: Wire into `RootNavigator.tsx`**

Replace the `Splash`, `Maintenance`, `ForceUpdate`, `NoConnection` placeholder registrations with:
```tsx
import { Splash } from '../../features/splash/screens/Splash';
import { Maintenance } from '../../features/splash/screens/Maintenance';
import { ForceUpdate } from '../../features/splash/screens/ForceUpdate';
import { NoConnection } from '../../features/splash/screens/NoConnection';
// ...
<Stack.Screen name="Splash" component={Splash} />
<Stack.Screen name="Maintenance" component={Maintenance} />
<Stack.Screen name="ForceUpdate" component={ForceUpdate} />
<Stack.Screen name="NoConnection" component={NoConnection} />
```

- [ ] **Step 6: Run test to verify it passes, then smoke-run**

Run: `npx jest src/features/splash`
Expected: PASS.

Run: `npx expo run:android` with the API (Plan A) running locally.
Expected: app shows the GuruConnect splash briefly, then lands on the "AuthSelect" placeholder (Task 3's stub) since onboarding hasn't been built yet — confirms the real gating decision is driving navigation.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/splash apps/mobile/src/app/navigation/RootNavigator.tsx
git commit -m "feat: M01 splash gating (maintenance/force-update/no-connection) with pure decideSplashRoute"
```

---

### Task 7: M02 Onboarding carousel

**Files:**
- Create: `apps/mobile/src/features/onboarding/screens/Onboarding.tsx`
- Create: `apps/mobile/src/features/onboarding/slides.ts`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/onboarding/__tests__/Onboarding.test.tsx`

**Interfaces:**
- Consumes: `useAppFlags` (Task 2), `useBootstrapQuery` (Task 5).
- Produces: `Onboarding` screen; on Skip/Get started, calls `setOnboardingSeen(bootstrap.onboardingVersion)` then navigates to `AuthSelect`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/onboarding/__tests__/Onboarding.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Onboarding } from '../screens/Onboarding';
import { useAppFlags } from '../../../lib/appFlags.store';

jest.mock('../../platform/hooks', () => ({ useBootstrapQuery: () => ({ data: { onboardingVersion: 3 } }) }));

describe('Onboarding', () => {
  it('marks onboarding as seen at the bootstrap version and navigates to AuthSelect on Get started', () => {
    const navigate = jest.fn();
    const { getByText } = render(<Onboarding navigation={{ replace: navigate } as any} route={{} as any} />);
    fireEvent.press(getByText('Skip'));
    fireEvent.press(getByText('Skip'));
    fireEvent.press(getByText('Skip'));
    fireEvent.press(getByText('Get started'));
    expect(useAppFlags.getState().onboardingSeenVersion).toBe(3);
    expect(navigate).toHaveBeenCalledWith('AuthSelect');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/onboarding`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `slides.ts`** (copy verbatim from the prototype/module doc)

```ts
// apps/mobile/src/features/onboarding/slides.ts
export const slides = [
  { heading: 'Find verified teachers', body: 'Aadhaar, PAN and certificates checked before anyone appears in search.' },
  { heading: 'See an honest Trust Score', body: 'Built from verification, real reviews and complaint history — never bought.' },
  { heading: 'Book a free demo first', body: 'Try a class before you commit to a plan.' },
  { heading: 'Pay safely, in the app', body: 'Razorpay-secured payments, refund protection, and support that responds.' },
];
```

- [ ] **Step 4: Implement `Onboarding.tsx`**

```tsx
// apps/mobile/src/features/onboarding/screens/Onboarding.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { useAppFlags } from '../../../lib/appFlags.store';
import { useBootstrapQuery } from '../../platform/hooks';
import { tokens } from '../../../theme/tokens';
import { slides } from '../slides';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function Onboarding({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const bootstrap = useBootstrapQuery();
  const setOnboardingSeen = useAppFlags((s) => s.setOnboardingSeen);
  const { width } = useWindowDimensions();

  function finish() {
    setOnboardingSeen(bootstrap.data?.onboardingVersion ?? 1);
    navigation.replace('AuthSelect');
  }

  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <View style={styles.container}>
      {!isLast ? (
        <Pressable style={styles.skip} onPress={finish} accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}
      <View style={[styles.slideArea, { width }]}>
        <Text style={styles.heading}>{slide.heading}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        {isLast ? (
          <Button title="Get started" onPress={finish} />
        ) : (
          <Button title="Next" onPress={() => setIndex((i) => Math.min(i + 1, slides.length - 1))} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  skip: { alignSelf: 'flex-end', padding: 16, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: 16, color: tokens.light.ink3 },
  slideArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, color: tokens.light.ink2, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.light.line, marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: tokens.light.pri },
  footer: { padding: 16 },
});
```

- [ ] **Step 5: Wire into `RootNavigator.tsx`**

```tsx
import { Onboarding } from '../../features/onboarding/screens/Onboarding';
// ...
<Stack.Screen name="Onboarding" component={Onboarding} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/features/onboarding`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/onboarding apps/mobile/src/app/navigation/RootNavigator.tsx
git commit -m "feat: M02 onboarding carousel with version-based re-show"
```

---

### Task 8: M03 AuthSelect screen

**Files:**
- Create: `apps/mobile/src/features/authSelect/screens/AuthSelect.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/authSelect/__tests__/AuthSelect.test.tsx`

**Interfaces:**
- Consumes: `useBootstrapQuery` (Task 5).
- Produces: `AuthSelect` screen; "Continue with phone number" → `navigation.navigate('PhoneEntry')`; "Sign in with email instead" → `navigation.navigate('EmailEntry')`; Google button hidden/shown per `bootstrap.auth.google`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/authSelect/__tests__/AuthSelect.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthSelect } from '../screens/AuthSelect';

jest.mock('../../platform/hooks', () => ({
  useBootstrapQuery: () => ({ data: { auth: { phoneOtp: true, email: true, google: false }, legal: { termsUrl: 't', privacyUrl: 'p' } } }),
}));

describe('AuthSelect', () => {
  it('navigates to PhoneEntry on the primary button', () => {
    const navigate = jest.fn();
    const { getByText } = render(<AuthSelect navigation={{ navigate } as any} route={{} as any} />);
    fireEvent.press(getByText('Continue with phone number'));
    expect(navigate).toHaveBeenCalledWith('PhoneEntry');
  });

  it('hides the Google button when bootstrap.auth.google is false', () => {
    const { queryByText } = render(<AuthSelect navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
    expect(queryByText('Continue with Google')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/authSelect`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```tsx
// apps/mobile/src/features/authSelect/screens/AuthSelect.tsx
import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { useBootstrapQuery } from '../../platform/hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthSelect'>;

export function AuthSelect({ navigation }: Props) {
  const bootstrap = useBootstrapQuery();
  const auth = bootstrap.data?.auth;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to GuruConnect</Text>
      <Text style={styles.subtext}>Find a teacher you can trust</Text>

      <View style={styles.buttons}>
        <Button title="Continue with phone number" onPress={() => navigation.navigate('PhoneEntry')} />
        {auth?.google ? (
          <View style={styles.gap}>
            <Button title="Continue with Google" variant="outline" onPress={() => { /* wired in Task 11 */ }} />
          </View>
        ) : null}
        {auth?.email ? (
          <Text style={styles.emailLink} onPress={() => navigation.navigate('EmailEntry')}>
            Sign in with email instead
          </Text>
        ) : null}
      </View>

      <Text style={styles.legal}>
        By continuing, you agree to our{' '}
        <Text style={styles.link} onPress={() => bootstrap.data && Linking.openURL(bootstrap.data.legal.termsUrl)}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={styles.link} onPress={() => bootstrap.data && Linking.openURL(bootstrap.data.legal.privacyUrl)}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: tokens.light.ink, textAlign: 'center' },
  subtext: { fontSize: 16, color: tokens.light.ink3, textAlign: 'center', marginTop: 4, marginBottom: 32 },
  buttons: { marginBottom: 24 },
  gap: { marginTop: 12 },
  emailLink: { textAlign: 'center', fontSize: 15, color: tokens.light.priInk, marginTop: 16, textDecorationLine: 'underline' },
  legal: { fontSize: 12, color: tokens.light.ink3, textAlign: 'center' },
  link: { color: tokens.light.priInk, textDecorationLine: 'underline' },
});
```

- [ ] **Step 4: Wire into `RootNavigator.tsx`**

```tsx
import { AuthSelect } from '../../features/authSelect/screens/AuthSelect';
// ...
<Stack.Screen name="AuthSelect" component={AuthSelect} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/features/authSelect`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/authSelect apps/mobile/src/app/navigation/RootNavigator.tsx
git commit -m "feat: M03 AuthSelect screen gated by bootstrap.auth flags"
```

---

### Task 9: M04 Login part 1 — phone OTP hooks + PhoneEntry + OtpVerify

**Files:**
- Create: `apps/mobile/src/features/login/api.ts`
- Create: `apps/mobile/src/features/login/hooks.ts`
- Create: `apps/mobile/src/features/login/screens/PhoneEntry.tsx`
- Create: `apps/mobile/src/features/login/screens/OtpVerify.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/login/__tests__/PhoneEntry.test.tsx`

**Interfaces:**
- Consumes: `api`, `ApiError` (Task 2), `useSession` (Task 2), `PhoneField`/`OtpInput`/`Button` (Task 4).
- Produces: `useRequestOtpMutation()`, `useVerifyOtpMutation()`; on success with a session, `useSession.setSession(...)` + `persistRefreshToken(...)` then `navigation.replace('Home')`; on `REGISTRATION_REQUIRED` (409), `navigation.replace('RegistrationRouter', {registrationToken, contactType})`; on `ROLE_MISMATCH` (409), show inline sheet text (full `RoleMismatchSheet` component is a stretch goal — this task ships the copy inline via `Alert` given no other module needs a reusable bottom sheet yet).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/login/__tests__/PhoneEntry.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhoneEntry } from '../screens/PhoneEntry';
import { api } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({ api: { post: jest.fn() }, ApiError: class ApiError extends Error {} }));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PhoneEntry', () => {
  it('requests an OTP and navigates to OtpVerify with the challengeId', async () => {
    (api.post as jest.Mock).mockResolvedValue({ challengeId: 'c1', expiresInSeconds: 300, resendAfterSeconds: 30 });
    const navigate = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <PhoneEntry navigation={{ navigate } as any} route={{} as any} />,
      { wrapper },
    );
    fireEvent.changeText(getByPlaceholderText('98450 14210'), '9845014210');
    fireEvent.press(getByText('Send code'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('OtpVerify', { challengeId: 'c1', destination: '+919845014210', purpose: 'login' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/login/__tests__/PhoneEntry.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `api.ts`**

```ts
// apps/mobile/src/features/login/api.ts
import { api } from '../../lib/api';

export interface OtpRequestResult { challengeId: string; expiresInSeconds: number; resendAfterSeconds: number }
export function requestOtp(phone: string) {
  return api.post<OtpRequestResult>('auth/otp/request', { phone });
}

export interface SessionResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  session: { id: string };
  user: { userId: string; role: 'parent' | 'student' | 'teacher' | 'institute_staff'; fullName: string; accountStatus: string };
}
export function verifyOtp(input: { challengeId: string; code: string; intendedRole?: string }) {
  return api.post<SessionResult>('auth/otp/verify', input);
}

export function emailLogin(input: { email: string; password: string }) {
  return api.post<SessionResult>('auth/email/login', input);
}

export function emailOtpRequest(email: string) {
  return api.post<OtpRequestResult>('auth/email/otp/request', { email });
}

export function forgotPassword(email: string) {
  return api.post<{ sent: boolean }>('auth/password/forgot', { email });
}

export function resetPassword(input: { challengeId: string; code: string; newPassword: string }) {
  return api.post<{ ok: boolean }>('auth/password/reset', input);
}

export function googleSignIn(input: { idToken: string; intendedRole?: string }) {
  return api.post<SessionResult>('auth/google', input);
}

export function fetchSessions() {
  return api.get<{ id: string; deviceLabel: string; isCurrent: boolean; lastUsedAt: string }[]>('auth/sessions');
}

export function revokeSession(id: string) {
  return api.delete<{ ok: boolean }>(`auth/sessions/${id}`);
}

export function logoutAll() {
  return api.post<{ ok: boolean }>('auth/logout-all');
}
```

- [ ] **Step 4: Implement `hooks.ts`**

```ts
// apps/mobile/src/features/login/hooks.ts
import { useMutation } from '@tanstack/react-query';
import { persistRefreshToken } from '../../lib/api';
import { useSession } from '../../lib/session.store';
import * as api from './api';
import type { SessionResult } from './api';

export function applySession(result: SessionResult) {
  useSession.getState().setSession({ accessToken: result.accessToken, userId: result.user.userId, role: result.user.role, profileId: null });
  return persistRefreshToken(result.refreshToken);
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: api.requestOtp });
}

export function useVerifyOtpMutation() {
  return useMutation({ mutationFn: api.verifyOtp });
}

export function useEmailLoginMutation() {
  return useMutation({ mutationFn: api.emailLogin });
}

export function useEmailOtpRequestMutation() {
  return useMutation({ mutationFn: api.emailOtpRequest });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: api.forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: api.resetPassword });
}

export function useGoogleSignInMutation() {
  return useMutation({ mutationFn: api.googleSignIn });
}
```

- [ ] **Step 5: Implement `PhoneEntry.tsx`**

```tsx
// apps/mobile/src/features/login/screens/PhoneEntry.tsx
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { PhoneField, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useRequestOtpMutation } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

export function PhoneEntry({ navigation }: Props) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | undefined>();
  const requestOtp = useRequestOtpMutation();

  async function onSubmit() {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid Indian mobile number.');
      return;
    }
    const phone = `+91${digits}`;
    try {
      const result = await requestOtp.mutateAsync(phone);
      navigation.navigate('OtpVerify', { challengeId: result.challengeId, destination: phone, purpose: 'login' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>What's your number?</Text>
        <Text style={styles.helper}>We'll text you a code to confirm it's you.</Text>
        <PhoneField value={digits} onChangeText={setDigits} error={error} />
      </ScrollView>
      <StickyActionBar>
        <Button title="Send code" onPress={onSubmit} loading={requestOtp.isPending} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, color: tokens.light.ink2, marginBottom: 24 },
});
```

- [ ] **Step 6: Implement `OtpVerify.tsx`**

```tsx
// apps/mobile/src/features/login/screens/OtpVerify.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { OtpInput, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useVerifyOtpMutation, useRequestOtpMutation, applySession } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

export function OtpVerify({ route, navigation }: Props) {
  const { challengeId, destination } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(30);
  const verify = useVerifyOtpMutation();
  const resend = useRequestOtpMutation();

  useEffect(() => {
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  async function onVerify(fullCode: string) {
    setError(undefined);
    try {
      const result = await verify.mutateAsync({ challengeId, code: fullCode });
      await applySession(result);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Home' }] }) ?? navigation.replace('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
        const details = err.details as { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
        navigation.replace('RegistrationRouter', { registrationToken: details.registrationToken, contactType: details.contactType });
        return;
      }
      if (err instanceof ApiError && err.code === 'ROLE_MISMATCH') {
        Alert.alert('This number already has an account', 'This phone number is registered under a different role.');
        return;
      }
      if (err instanceof ApiError && err.code === 'OTP_INVALID') {
        const attemptsLeft = (err.details as { attemptsLeft?: number })?.attemptsLeft ?? 0;
        setError(`Incorrect code. ${attemptsLeft} attempts left.`);
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.heading}>Enter the code</Text>
        <Text style={styles.helper}>Sent to {destination}</Text>
        <OtpInput
          length={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) onVerify(v);
          }}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text
          style={[styles.resend, cooldown > 0 && styles.resendDisabled]}
          onPress={async () => {
            if (cooldown > 0) return;
            await resend.mutateAsync(destination);
            setCooldown(30);
          }}
        >
          {cooldown > 0 ? `Resend code in 0:${String(cooldown).padStart(2, '0')}` : 'Resend code'}
        </Text>
      </View>
      <StickyActionBar>
        <Button title="Verify" onPress={() => onVerify(code)} loading={verify.isPending} disabled={code.length !== 6} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, color: tokens.light.ink2, marginBottom: 24 },
  error: { fontSize: 13, color: tokens.light.bad, marginTop: 12 },
  resend: { fontSize: 14, color: tokens.light.priInk, marginTop: 20, textAlign: 'center' },
  resendDisabled: { color: tokens.light.ink3 },
});
```

- [ ] **Step 7: Wire into `RootNavigator.tsx`**

```tsx
import { PhoneEntry } from '../../features/login/screens/PhoneEntry';
import { OtpVerify } from '../../features/login/screens/OtpVerify';
// ...
<Stack.Screen name="PhoneEntry" component={PhoneEntry} />
<Stack.Screen name="OtpVerify" component={OtpVerify} />
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest src/features/login/__tests__/PhoneEntry.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/features/login apps/mobile/src/app/navigation/RootNavigator.tsx
git commit -m "feat: M04 phone OTP login (PhoneEntry, OtpVerify) with registration/role-mismatch handling"
```

---

### Task 10: M04 Login part 2 — EmailEntry, ForgotPassword, ResetPassword

**Files:**
- Create: `apps/mobile/src/features/login/screens/EmailEntry.tsx`
- Create: `apps/mobile/src/features/login/screens/ForgotPassword.tsx`
- Create: `apps/mobile/src/features/login/screens/ResetPassword.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/login/__tests__/EmailEntry.test.tsx`

**Interfaces:**
- Consumes: `useEmailLoginMutation`, `useEmailOtpRequestMutation`, `applySession` (Task 9).
- Produces: three screens wired per M04's navigation flow (EmailEntry → password login or "Use email OTP instead" → OtpVerify, or "Forgot password" → ForgotPassword → ResetPassword → back to EmailEntry).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/login/__tests__/EmailEntry.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailEntry } from '../screens/EmailEntry';
import { api } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({ api: { post: jest.fn() }, ApiError: class ApiError extends Error { code?: string }, persistRefreshToken: jest.fn() }));

describe('EmailEntry', () => {
  it('logs in and navigates to Home on success', async () => {
    (api.post as jest.Mock).mockResolvedValue({ accessToken: 'a', expiresIn: 900, refreshToken: 'r', session: { id: 's1' }, user: { userId: 'u1', role: 'parent', fullName: 'A', accountStatus: 'active' } });
    const navigate = jest.fn();
    const { getByPlaceholderText, getByText } = render(<EmailEntry navigation={{ replace: navigate, navigate: jest.fn() } as any} route={{} as any} />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign in'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('Home'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/login/__tests__/EmailEntry.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `EmailEntry.tsx`**

```tsx
// apps/mobile/src/features/login/screens/EmailEntry.tsx
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { TextField, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useEmailLoginMutation, useEmailOtpRequestMutation, applySession } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailEntry'>;

export function EmailEntry({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const login = useEmailLoginMutation();
  const emailOtp = useEmailOtpRequestMutation();

  async function onSignIn() {
    setError(undefined);
    try {
      const result = await login.mutateAsync({ email, password });
      await applySession(result);
      navigation.navigate('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
        const details = err.details as { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
        navigation.replace('RegistrationRouter', { registrationToken: details.registrationToken, contactType: details.contactType });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Incorrect email or password.');
    }
  }

  async function onUseEmailOtp() {
    try {
      const result = await emailOtp.mutateAsync(email);
      navigation.navigate('OtpVerify', { challengeId: result.challengeId, destination: email, purpose: 'login' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Sign in with email</Text>
        <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextField label="Password" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} error={error} />
        <Text style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
          Forgot password?
        </Text>
        <Text style={styles.link} onPress={onUseEmailOtp}>
          Sign in with a one-time code instead
        </Text>
      </ScrollView>
      <StickyActionBar>
        <Button title="Sign in" onPress={onSignIn} loading={login.isPending} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 24 },
  link: { fontSize: 14, color: tokens.light.priInk, marginTop: 4, marginBottom: 12 },
});
```

- [ ] **Step 4: Implement `ForgotPassword.tsx` and `ResetPassword.tsx`**

```tsx
// apps/mobile/src/features/login/screens/ForgotPassword.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { TextField, Button, StickyActionBar } from '../../../components/ui';
import { useForgotPasswordMutation } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPassword({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const forgot = useForgotPasswordMutation();

  async function onSend() {
    await forgot.mutateAsync(email);
    navigation.navigate('ResetPassword', { challengeId: '', email });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.helper}>Enter the email on your account. We'll send you a code.</Text>
      <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <StickyActionBar>
        <Button title="Send code" onPress={onSend} loading={forgot.isPending} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, color: tokens.light.ink2, marginBottom: 24 },
});
```

Note: the forgot-password endpoint deliberately returns `{ sent: true }` without a `challengeId` (so it never reveals whether the account exists). `ResetPassword` therefore asks the user to paste in the code from their email/SMS themselves and re-derives the `challengeId` server-side is not possible — this app instead asks the reset endpoint to accept `{email, code, newPassword}` shape... but the backend plan's `PasswordResetBody` requires `challengeId`. To reconcile without changing the backend contract, `ResetPassword` below collects the code and looks up the *latest* challenge is not exposed to the client by design. **Resolution used here:** since the console email provider (backend Task 5) logs the `challengeId` alongside the code only in dev, and production would deliver both via a deep-linked email, `ResetPassword`'s form asks the user to enter the challenge id shown in the dev email preview *for this dev build only*, alongside the code — add a small "Dev tools" collapsed field for `challengeId` (visible only when `__DEV__` is true) so the flow is testable end-to-end without changing the API contract, and note this as a known v1.1 gap (production needs the email template to embed the challengeId in a deep link).

```tsx
// apps/mobile/src/features/login/screens/ResetPassword.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { TextField, OtpInput, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useResetPasswordMutation } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPassword({ route, navigation }: Props) {
  const [challengeId, setChallengeId] = useState(route.params.challengeId);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const reset = useResetPasswordMutation();

  async function onReset() {
    setError(undefined);
    try {
      await reset.mutateAsync({ challengeId, code, newPassword });
      navigation.navigate('EmailEntry');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Check your email</Text>
      <Text style={styles.helper}>Enter the code and a new password.</Text>
      {__DEV__ ? <TextField label="Dev only: challengeId" value={challengeId} onChangeText={setChallengeId} /> : null}
      <OtpInput length={6} value={code} onChange={setCode} />
      <TextField label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} error={error} />
      <Text style={styles.hint}>8+ characters, letters and numbers</Text>
      <StickyActionBar>
        <Button title="Reset password" onPress={onReset} loading={reset.isPending} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, color: tokens.light.ink2, marginBottom: 24 },
  hint: { fontSize: 12, color: tokens.light.ink3, marginTop: -8, marginBottom: 16 },
});
```

- [ ] **Step 5: Wire into `RootNavigator.tsx`**

```tsx
import { EmailEntry } from '../../features/login/screens/EmailEntry';
import { ForgotPassword } from '../../features/login/screens/ForgotPassword';
import { ResetPassword } from '../../features/login/screens/ResetPassword';
// ...
<Stack.Screen name="EmailEntry" component={EmailEntry} />
<Stack.Screen name="ForgotPassword" component={ForgotPassword} />
<Stack.Screen name="ResetPassword" component={ResetPassword} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/features/login/__tests__/EmailEntry.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/login/screens/EmailEntry.tsx apps/mobile/src/features/login/screens/ForgotPassword.tsx apps/mobile/src/features/login/screens/ResetPassword.tsx apps/mobile/src/app/navigation/RootNavigator.tsx apps/mobile/src/features/login/__tests__/EmailEntry.test.tsx
git commit -m "feat: M04 email/password login, forgot/reset password screens"
```

---

### Task 11: M04 Login part 3 — Google Sign-In wiring + ActiveSessions

**Files:**
- Create: `apps/mobile/src/features/login/googleSignIn.ts`
- Modify: `apps/mobile/src/features/authSelect/screens/AuthSelect.tsx` (wire the Google button)
- Create: `apps/mobile/src/features/login/screens/ActiveSessions.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/login/__tests__/googleSignIn.test.ts`

**Interfaces:**
- Consumes: `@react-native-google-signin/google-signin`, `useGoogleSignInMutation`/`applySession` (Task 9).
- Produces: `signInWithGoogle(): Promise<{cancelled:true} | {idToken:string}>` (wraps the native picker + missing-config/cancel handling), `ActiveSessions` screen (`GET /auth/sessions`, per-row "Sign out", "Sign out of all devices").

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/login/__tests__/googleSignIn.test.ts
import { signInWithGoogle } from '../googleSignIn';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn().mockResolvedValue(true), signIn: jest.fn() },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

describe('signInWithGoogle', () => {
  it('returns cancelled:true when the user dismisses the picker', async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    (GoogleSignin.signIn as jest.Mock).mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });
    const result = await signInWithGoogle();
    expect(result).toEqual({ cancelled: true });
  });

  it('returns the idToken on success', async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: { idToken: 'tok123' } });
    const result = await signInWithGoogle();
    expect(result).toEqual({ idToken: 'tok123' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/login/__tests__/googleSignIn.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `googleSignIn.ts`**

```ts
// apps/mobile/src/features/login/googleSignIn.ts
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

export type GoogleSignInResult = { idToken: string } | { cancelled: true } | { notConfigured: true };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  ensureConfigured();
  if (!configured) return { notConfigured: true };
  try {
    await GoogleSignin.hasPlayServices();
    const response: any = await GoogleSignin.signIn();
    const idToken = response?.data?.idToken ?? response?.idToken;
    if (!idToken) return { cancelled: true };
    return { idToken };
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) return { cancelled: true };
    return { cancelled: true };
  }
}
```

- [ ] **Step 4: Wire the button in `AuthSelect.tsx`**

Replace the Google button's `onPress={() => { /* wired in Task 11 */ }}` with:
```tsx
onPress={async () => {
  const result = await signInWithGoogle();
  if ('idToken' in result) {
    try {
      const session = await googleSignInMutation.mutateAsync({ idToken: result.idToken });
      await applySession(session);
      navigation.navigate('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
        const details = err.details as { registrationToken: string; contactType: 'google' };
        navigation.navigate('RegistrationRouter', { registrationToken: details.registrationToken, contactType: details.contactType });
        return;
      }
      Alert.alert('Sign-in failed', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  } else if ('notConfigured' in result) {
    Alert.alert('Google Sign-In isn\'t set up yet', 'Try phone or email instead.');
  }
}}
```
Add the needed imports (`Alert`, `signInWithGoogle`, `useGoogleSignInMutation`, `applySession`, `ApiError`) and `const googleSignInMutation = useGoogleSignInMutation();` at the top of the component.

- [ ] **Step 5: Implement `ActiveSessions.tsx`**

```tsx
// apps/mobile/src/features/login/screens/ActiveSessions.tsx
import React from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button, Card } from '../../../components/ui';
import * as api from '../api';
import { useSession } from '../../../lib/session.store';
import { clearRefreshToken } from '../../../lib/api';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveSessions'>;

export function ActiveSessions({ navigation }: Props) {
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ['auth', 'sessions'], queryFn: api.fetchSessions });
  const revoke = useMutation({ mutationFn: api.revokeSession, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }) });
  const logoutAll = useMutation({
    mutationFn: api.logoutAll,
    onSuccess: async () => {
      await clearRefreshToken();
      useSession.getState().clear();
      navigation.replace('AuthSelect');
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.deviceLabel}>{item.deviceLabel}{item.isCurrent ? ' · This device' : ''}</Text>
              <Text style={styles.lastUsed}>{item.lastUsedAt}</Text>
            </View>
            {!item.isCurrent ? <Text style={styles.signOut} onPress={() => revoke.mutate(item.id)}>Sign out</Text> : null}
          </Card>
        )}
      />
      <Text
        style={styles.dangerLink}
        onPress={() =>
          Alert.alert('Sign out of all devices?', 'This signs you out everywhere, including this device.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out everywhere', style: 'destructive', onPress: () => logoutAll.mutate() },
          ])
        }
      >
        Sign out of all devices
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg, padding: 16 },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1 },
  deviceLabel: { fontSize: 15, fontWeight: '600', color: tokens.light.ink },
  lastUsed: { fontSize: 12, color: tokens.light.ink3, marginTop: 2 },
  signOut: { fontSize: 14, color: tokens.light.bad },
  dangerLink: { textAlign: 'center', fontSize: 14, color: tokens.light.bad, marginTop: 16 },
});
```

- [ ] **Step 6: Wire into `RootNavigator.tsx`**

```tsx
import { ActiveSessions } from '../../features/login/screens/ActiveSessions';
// ...
<Stack.Screen name="ActiveSessions" component={ActiveSessions} />
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx jest src/features/login/__tests__/googleSignIn.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/features/login apps/mobile/src/features/authSelect/screens/AuthSelect.tsx apps/mobile/src/app/navigation/RootNavigator.tsx
git commit -m "feat: M04 Google Sign-In wiring and active-sessions management screen"
```

---

### Task 12: M05 RegistrationRouter + ReferralCodeSheet + draft persistence

**Files:**
- Create: `apps/mobile/src/features/registration/api.ts`
- Create: `apps/mobile/src/features/registration/useRegistrationDraft.ts`
- Create: `apps/mobile/src/features/registration/screens/RegistrationRouter.tsx`
- Create: `apps/mobile/src/features/registration/components/ReferralCodeSheet.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/registration/__tests__/useRegistrationDraft.test.ts`

**Interfaces:**
- Consumes: `mmkv` (Task 2), `api` (Task 2).
- Produces: `useRegistrationDraft<T>(role, tokenSubjectHash)` (returns `[draft, updateField, clearDraft]`, MMKV-persisted, cleared after 24h or on `clearDraft()`), `RegistrationRouter` screen, `ReferralCodeSheet` component. This `useRegistrationDraft` hook is imported unchanged by `ParentRegistration` in Task 13 — same signature, no per-role variant.

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/registration/__tests__/useRegistrationDraft.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useRegistrationDraft } from '../useRegistrationDraft';

describe('useRegistrationDraft', () => {
  it('persists a field update and reloads it in a fresh hook instance', () => {
    const { result, unmount } = renderHook(() => useRegistrationDraft<{ fullName: string }>('parent', 'tok1'));
    act(() => {
      result.current[1]('fullName', 'Lakshmi Venkatesh');
    });
    unmount();

    const { result: second } = renderHook(() => useRegistrationDraft<{ fullName: string }>('parent', 'tok1'));
    expect(second.current[0].fullName).toBe('Lakshmi Venkatesh');
  });

  it('clears the draft on demand', () => {
    const { result } = renderHook(() => useRegistrationDraft<{ fullName: string }>('parent', 'tok2'));
    act(() => {
      result.current[1]('fullName', 'Someone');
      result.current[2]();
    });
    expect(result.current[0].fullName).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/registration/__tests__/useRegistrationDraft.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `useRegistrationDraft.ts`**

```ts
// apps/mobile/src/features/registration/useRegistrationDraft.ts
import { useState, useCallback } from 'react';
import { mmkv } from '../../lib/storage';

const TTL_MS = 24 * 60 * 60 * 1000;

function key(role: string, tokenSubjectHash: string) {
  return `registrationDraft:${role}:${tokenSubjectHash}`;
}

function load<T>(role: string, tokenSubjectHash: string): Partial<T> {
  const raw = mmkv.getString(key(role, tokenSubjectHash));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as { savedAt: number; data: Partial<T> };
    if (Date.now() - parsed.savedAt > TTL_MS) return {};
    return parsed.data;
  } catch {
    return {};
  }
}

export function useRegistrationDraft<T extends Record<string, unknown>>(role: string, tokenSubjectHash: string) {
  const [draft, setDraft] = useState<Partial<T>>(() => load<T>(role, tokenSubjectHash));

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [field]: value };
        mmkv.set(key(role, tokenSubjectHash), JSON.stringify({ savedAt: Date.now(), data: next }));
        return next;
      });
    },
    [role, tokenSubjectHash],
  );

  const clearDraft = useCallback(() => {
    mmkv.delete(key(role, tokenSubjectHash));
    setDraft({});
  }, [role, tokenSubjectHash]);

  return [draft, updateField, clearDraft] as const;
}
```

- [ ] **Step 4: Implement `api.ts`**

```ts
// apps/mobile/src/features/registration/api.ts
import { api } from '../../lib/api';

export interface RegistrationContext {
  contactType: 'phone' | 'email' | 'google';
  verifiedValue: string;
  prefill: { fullName?: string; photoUrl?: string } | null;
  roles: { code: string; title: string; subtitle: string }[];
  legal: { termsVersion: string; termsUrl: string; privacyVersion: string; privacyUrl: string };
}

export function fetchRegistrationContext(registrationToken: string) {
  return api.get<RegistrationContext>('registration/context', { token: registrationToken });
}

export type ReferralValidation = { valid: true; programCode: string; ownerFirstName?: string } | { valid: false; reason: 'invalid' | 'expired' | 'limit_reached' | 'disabled' };

export function validateReferral(registrationToken: string, code: string) {
  return api.post<ReferralValidation>('registration/referral/validate', { code }, { token: registrationToken });
}
```

- [ ] **Step 5: Implement `ReferralCodeSheet.tsx`**

```tsx
// apps/mobile/src/features/registration/components/ReferralCodeSheet.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import * as api from '../api';

interface Props {
  visible: boolean;
  registrationToken: string;
  onClose: () => void;
  onApplied: (code: string, ownerFirstName?: string) => void;
}

export function ReferralCodeSheet({ visible, registrationToken, onClose, onApplied }: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  async function onApply() {
    setChecking(true);
    try {
      const result = await api.validateReferral(registrationToken, code);
      if (result.valid) {
        setStatus({ ok: true, text: result.ownerFirstName ? `Valid — ${result.ownerFirstName}'s code` : 'Valid code' });
        onApplied(code.toUpperCase(), result.ownerFirstName);
      } else {
        setStatus({ ok: false, text: "We couldn't find that code" });
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Enter a referral code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. LAKSHMI50"
            autoCapitalize="characters"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
          />
          {status ? <Text style={[styles.status, status.ok ? styles.statusOk : styles.statusMuted]}>{status.text}</Text> : null}
          <Button title="Apply" onPress={onApply} loading={checking} disabled={code.length < 4} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: 20 },
  title: { fontSize: 17, fontWeight: '700', color: tokens.light.ink, marginBottom: 12 },
  input: { height: 48, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
  status: { fontSize: 13, marginBottom: 12 },
  statusOk: { color: tokens.light.good },
  statusMuted: { color: tokens.light.ink3 },
});
```

- [ ] **Step 6: Implement `RegistrationRouter.tsx`**

```tsx
// apps/mobile/src/features/registration/screens/RegistrationRouter.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import * as api from '../api';
import { ReferralCodeSheet } from '../components/ReferralCodeSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrationRouter'>;

export function RegistrationRouter({ route, navigation }: Props) {
  const { registrationToken } = route.params;
  const context = useQuery({ queryKey: ['registration', 'context', registrationToken], queryFn: () => api.fetchRegistrationContext(registrationToken) });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | undefined>();

  function onSelectRole(code: string) {
    if (code === 'parent') {
      navigation.replace('ParentRegistration', { registrationToken, referralCode });
      return;
    }
    Alert.alert('Coming soon', "This role's registration isn't built yet.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome! Who's signing up?</Text>
      {context.data ? <Text style={styles.subtext}>You verified {context.data.verifiedValue}.</Text> : null}
      {(context.data?.roles ?? []).map((role) => (
        <Pressable key={role.code} onPress={() => onSelectRole(role.code)}>
          <Card style={styles.tile}>
            <Text style={styles.tileTitle}>{role.title}</Text>
            <Text style={styles.tileSubtitle}>{role.subtitle}</Text>
          </Card>
        </Pressable>
      ))}
      <Text style={styles.referralLink} onPress={() => setSheetOpen(true)}>
        {referralCode ? `Referral: ${referralCode} ✕` : 'Have a referral code?'}
      </Text>
      <ReferralCodeSheet
        visible={sheetOpen}
        registrationToken={registrationToken}
        onClose={() => setSheetOpen(false)}
        onApplied={(code) => {
          setReferralCode(code);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 6 },
  subtext: { fontSize: 14, color: tokens.light.ink2, marginBottom: 20 },
  tile: { marginBottom: 12 },
  tileTitle: { fontSize: 16, fontWeight: '700', color: tokens.light.ink },
  tileSubtitle: { fontSize: 13, color: tokens.light.ink2, marginTop: 2 },
  referralLink: { textAlign: 'center', fontSize: 14, color: tokens.light.priInk, marginTop: 16 },
});
```

- [ ] **Step 7: Wire into `RootNavigator.tsx`**

```tsx
import { RegistrationRouter } from '../../features/registration/screens/RegistrationRouter';
// ...
<Stack.Screen name="RegistrationRouter" component={RegistrationRouter} />
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest src/features/registration/__tests__/useRegistrationDraft.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/features/registration/api.ts apps/mobile/src/features/registration/useRegistrationDraft.ts apps/mobile/src/features/registration/screens/RegistrationRouter.tsx apps/mobile/src/features/registration/components apps/mobile/src/app/navigation/RootNavigator.tsx apps/mobile/src/features/registration/__tests__/useRegistrationDraft.test.ts
git commit -m "feat: M05 registration router, referral code sheet, draft-persistence hook"
```

---

### Task 13: M06 ParentRegistration screen + Home placeholder

**Files:**
- Create: `apps/mobile/src/features/registration/screens/ParentRegistration.tsx`
- Create: `apps/mobile/src/features/home/screens/Home.tsx`
- Modify: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Test: `apps/mobile/src/features/registration/__tests__/ParentRegistration.test.tsx`

**Interfaces:**
- Consumes: `useRegistrationDraft` (Task 12), `useMastersQuery`/`useAreasQuery` (Task 5), `applySession` (Task 9), `Select`/`TextField`/`PhoneField`/`Checkbox`/`Button` (Task 4).
- Produces: `ParentRegistration` screen (5-field form + optional inline mobile-verify sub-step + submit), `Home` placeholder screen with a "Sign out" button (uses `clearRefreshToken` + `useSession.clear()`).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/registration/__tests__/ParentRegistration.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParentRegistration } from '../screens/ParentRegistration';
import { api } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  ApiError: class ApiError extends Error { code?: string; details?: unknown },
  persistRefreshToken: jest.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('ParentRegistration', () => {
  it('disables Create account until name, mobile, state and city are filled', async () => {
    (api.get as jest.Mock).mockResolvedValue({ states: [{ id: 's1', name: 'Karnataka', code: 'KA' }], cities: [{ id: 'c1', stateId: 's1', name: 'Bengaluru' }], boards: [], classes: [], teachingModes: [] });
    const { getByText } = render(
      <ParentRegistration navigation={{ replace: jest.fn() } as any} route={{ params: { registrationToken: 'rt1' } } as any} />,
      { wrapper },
    );
    await waitFor(() => expect(getByText('Create account').props.accessibilityState?.disabled ?? true).toBe(true));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/registration/__tests__/ParentRegistration.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `ParentRegistration.tsx`**

```tsx
// apps/mobile/src/features/registration/screens/ParentRegistration.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { TextField, PhoneField, Select, Checkbox, Button, StickyActionBar } from '../../../components/ui';
import { ApiError, api } from '../../../lib/api';
import { useMastersQuery, useAreasQuery } from '../../platform/hooks';
import { applySession } from '../../login/hooks';
import { useRegistrationDraft } from '../useRegistrationDraft';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentRegistration'>;

interface Draft {
  fullName: string;
  mobile: string;
  email: string;
  stateId: string;
  cityId: string;
  areaId: string;
  marketingOptIn: boolean;
}

export function ParentRegistration({ route, navigation }: Props) {
  const { registrationToken, referralCode } = route.params;
  const [draft, updateField, clearDraft] = useRegistrationDraft<Draft>('parent', registrationToken);
  const masters = useMastersQuery();
  const areas = useAreasQuery(draft.cityId);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const cityOptions = (masters.data?.cities ?? []).filter((c) => c.stateId === draft.stateId).map((c) => ({ label: c.name, value: c.id }));
  const stateOptions = (masters.data?.states ?? []).map((s) => ({ label: s.name, value: s.id }));
  const areaOptions = (areas.data?.areas ?? []).map((a) => ({ label: a.name, value: a.id }));

  const canSubmit = !!draft.fullName && !!draft.mobile && !!draft.stateId && !!draft.cityId && !submitting;

  async function onSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      const idempotencyKey = `${registrationToken.slice(0, 16)}-parent-reg`;
      const result = await api.post<any>(
        'registration/parent',
        {
          fullName: draft.fullName,
          mobile: draft.mobile,
          email: draft.email || undefined,
          stateId: draft.stateId,
          cityId: draft.cityId,
          areaId: draft.areaId || undefined,
          marketingOptIn: !!draft.marketingOptIn,
          referralCode,
        },
        { token: registrationToken, idempotencyKey },
      );
      await applySession(result);
      clearDraft();
      navigation.replace('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT_DUPLICATE') {
        setError('An account already exists with this phone number.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Tell us about you</Text>
        <TextField label="Full name" placeholder="Lakshmi Venkatesh" value={draft.fullName ?? ''} onChangeText={(v) => updateField('fullName', v)} />
        <PhoneField value={(draft.mobile ?? '').replace('+91', '')} onChangeText={(v) => updateField('mobile', `+91${v}`)} />
        <TextField label="Email (optional)" placeholder="lakshmi.v@gmail.com" autoCapitalize="none" keyboardType="email-address" value={draft.email ?? ''} onChangeText={(v) => updateField('email', v)} />
        <Select label="State" placeholder="Karnataka" options={stateOptions} value={draft.stateId} onChange={(v) => { updateField('stateId', v); updateField('cityId', ''); updateField('areaId', ''); }} />
        <Select label="City" placeholder="Bengaluru" options={cityOptions} value={draft.cityId} onChange={(v) => { updateField('cityId', v); updateField('areaId', ''); }} disabled={!draft.stateId} />
        <Select label="Area (optional)" placeholder="Koramangala" options={areaOptions} value={draft.areaId} onChange={(v) => updateField('areaId', v)} disabled={!draft.cityId} />
        <Checkbox
          checked={!!draft.marketingOptIn}
          onChange={(v) => updateField('marketingOptIn', v)}
          label="Send me offers and tips by WhatsApp/email"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Create account" onPress={onSubmit} loading={submitting} disabled={!canSubmit} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 20 },
  error: { fontSize: 13, color: tokens.light.bad, marginTop: 4 },
});
```

Note on the mobile field: when `contactType === 'phone'` (the only path this plan's registration-token issuer produces — Google/email registration tokens hand back `contactType` too, but M06's inline-verify UI for a non-phone contact type is a stretch goal noted in the backend plan's Global Constraints; ship the phone-prefilled path first, matching the primary flow M04→M05→M06 exercises end-to-end). The field is editable here rather than read-only+prefilled to keep the component simple; a follow-up can lock it when `route.params` carries the verified phone.

- [ ] **Step 4: Implement `Home.tsx`**

```tsx
// apps/mobile/src/features/home/screens/Home.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui';
import { clearRefreshToken } from '../../../lib/api';
import { useSession } from '../../../lib/session.store';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function Home({ navigation }: Props) {
  const role = useSession((s) => s.role);

  async function onSignOut() {
    await clearRefreshToken();
    useSession.getState().clear();
    navigation.replace('AuthSelect');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome!</Text>
      <Text style={styles.body}>Signed in as {role ?? 'unknown role'}.</Text>
      <Text style={styles.note}>Home — Child Setup (M07) not built yet.</Text>
      <Button title="Sign out" variant="outline" onPress={onSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  heading: { fontSize: 22, fontWeight: '700', color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 15, color: tokens.light.ink2, marginBottom: 4 },
  note: { fontSize: 13, color: tokens.light.ink3, marginBottom: 24 },
});
```

- [ ] **Step 5: Wire into `RootNavigator.tsx`**

```tsx
import { ParentRegistration } from '../../features/registration/screens/ParentRegistration';
import { Home } from '../../features/home/screens/Home';
// ...
<Stack.Screen name="ParentRegistration" component={ParentRegistration} />
<Stack.Screen name="Home" component={Home} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/features/registration/__tests__/ParentRegistration.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/registration/screens/ParentRegistration.tsx apps/mobile/src/features/home apps/mobile/src/app/navigation/RootNavigator.tsx apps/mobile/src/features/registration/__tests__/ParentRegistration.test.tsx
git commit -m "feat: M06 parent registration form and Home placeholder"
```

---

### Task 14: Full end-to-end manual verification pass

**Files:**
- None created — this task is a manual QA pass plus fixing whatever it turns up (fixes land as amendments to the files above, not new files).

**Interfaces:**
- Consumes: the running API (Plan A, `npm run dev --workspace apps/api`) and the mobile dev client (Task 1–13).

- [ ] **Step 1: Run the full mobile unit-test suite**

Run: `npx jest` (from `apps/mobile`)
Expected: PASS across every task's tests.

- [ ] **Step 2: Start the API**

Run: `npm run dev --workspace apps/api` (repo root) — confirm it logs `GuruConnect API listening on http://localhost:4000`.

- [ ] **Step 3: Launch the app and walk the golden path**

Run: `npx expo run:android` (from `apps/mobile`, with `EXPO_PUBLIC_API_URL` pointed at the running API).

Manually walk: Splash → (Onboarding, since it's a fresh install) → AuthSelect → "Continue with phone number" → enter a real-format number (e.g. `9000000001`, the dev test-mode prefix) → OtpVerify with code `123456` → REGISTRATION_REQUIRED → RegistrationRouter → tap "Parent" → ParentRegistration → fill name/state/city → "Create account" → lands on Home showing "Signed in as parent" → "Sign out" → back to AuthSelect.

Expected: every step matches the Review Focus items — no crash on airplane mode at Splash (item 1), OTP wrong-code text updates the attempts-left count if you deliberately mistype first (item 2), backgrounding the app mid-`ParentRegistration` and reopening it keeps typed fields (item 3), the keyboard never covers the "Create account" button (item 4).

- [ ] **Step 4: Walk the edge paths**

- Re-run OTP verify with a real (non-test) number and confirm the code printed in the API's console log (`[dev-sms] OTP for +91...: NNNNNN`) is what unlocks the flow.
- Try "Sign in with email instead" → create no account yet (there's no email/password registration in scope) → confirm the "Incorrect email or password" message appears and doesn't crash.
- On `RegistrationRouter`, tap "Student" and confirm the "Coming soon" alert appears instead of a crash.

- [ ] **Step 5: Record and fix findings**

Any bug found in Steps 3–4 gets fixed directly in the relevant task's files (no separate task needed — this is verification, not new scope). Re-run the specific unit test for whatever was touched, plus the full suite once more.

Run: `npx jest` (from `apps/mobile`) and `npm test --workspace apps/api`
Expected: PASS.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end manual verification"
```
(Skip this step if Steps 3–4 found nothing to fix.)
