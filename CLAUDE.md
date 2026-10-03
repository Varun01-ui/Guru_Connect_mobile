# CLAUDE.md

Instructions for Claude Code (or any agent) working in this repository.

## What this repo is

GuruConnect mobile app: a React Native (Expo, TypeScript) app for parents, students, teachers and institutes. This repo holds the **mobile app and its spec docs only**. The backend is a separate project maintained by the user at `D:\GuruConnect\GuruBackend` (Express + Kysely + Postgres, mounted at `/api/v1/app`). Do not create a backend in this repo, and do not edit `GuruBackend` unless the user asks. When a module needs endpoints that don't exist yet, build the mobile side against the spec's contract and give the user a short backend prompt.

Spec: `00-conventions.md` … `05-roadmap-and-enhancements.md` at the repo root, one file per module in `modules/`, and the visual prototype `guruconnect-mobile-prototype (2).html`. The prototype is the source of truth for look and copy. Where it conflicts with a module spec, prefer the prototype for visuals and the spec for business rules, and say so.

## Layout

```
apps/mobile/
  App.tsx                 providers, font + storage hydration gate
  src/core/navigation/    RootNavigator, MainTabs, types  (NOT src/app: Expo Router hijacks that name)
  src/features/<module>/  screens, components, api.ts, hooks.ts, rules.ts (pure logic + tests)
  src/components/ui/      shared UI kit
  src/lib/                api client, storage, session store, auth helpers
  src/theme/tokens.ts     colors/fonts from the prototype
```

## Status

Built: M00 (subset), M01, M02, M03 (merged into Login), M04, M05, M06, M07, M08, M09.
M07 to M09 need backend endpoints that may not exist yet: children CRUD, `GET /home/parent`, `GET/PATCH /parent/profile`, and an extended `GET /masters`. Check `GuruBackend/src/modules/app` before assuming they work.

## Running

```
# terminal 1
cd D:\GuruConnect\GuruBackend && npm run dev          # API on :4000

# terminal 2
cd D:\GuruMobile\apps\mobile && npx expo start --go   # scan the QR with Expo Go
```

`apps/mobile/.env`: `EXPO_PUBLIC_API_URL=http://<PC LAN IP>:4000/api/v1/app` (phone on the same Wi-Fi). `localhost` works for web preview only, `10.0.2.2` for an Android emulator. Restart Expo after changing it.

OTP codes are not sent anywhere: the backend prints `[dev-sms] OTP for +91…: NNNNNN` in its terminal.

## Conventions and gotchas

- The app runs in **Expo Go**, so avoid native modules Expo Go lacks (react-native-mmkv, Google Sign-In are out). Storage is `src/lib/storage.ts` (`kv`: in-memory + AsyncStorage, hydrated at startup) and `secureStorage` (expo-secure-store; in-memory on web).
- **API client** (`src/lib/api.ts`): the backend envelope is `{ data, meta }` / `{ error: { code, message, details } }`. Non-2xx responses raise `ApiError` with the backend `code` and `details`; check `err.code`, not HTTP status. ky's `baseUrl` needs a trailing slash (already normalised).
- Access token lives in memory only (Zustand). Refresh token and install id are in secure storage. `restoreSession()` rebuilds a session on cold start.
- Money is paise. Names must allow combining marks (`\p{M}`) so Hindi names validate.
- Screens that aren't built yet show "Coming soon" instead of failing.
- Tests: `cd apps/mobile && npx jest`. Put pure logic in `rules.ts` and test it there. Typecheck with `npx tsc --noEmit`.
