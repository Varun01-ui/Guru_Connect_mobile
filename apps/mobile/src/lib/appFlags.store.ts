import { create } from 'zustand';
import { kv } from './storage';

const KEY = 'gc_app_flags';

interface Flags {
  onboardingSeenVersion: number;
  lastRole: string | null;
  pendingDeepLink: string | null;
}

interface AppFlags extends Flags {
  setOnboardingSeen: (version: number) => void;
  setPendingDeepLink: (link: string | null) => void;
  reloadFromStorage: () => void;
}

const DEFAULTS: Flags = { onboardingSeenVersion: 0, lastRole: null, pendingDeepLink: null };

function load(): Flags {
  const raw = kv.getString(KEY);
  if (!raw) return DEFAULTS;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULTS;
  }
}

function persist(state: Flags) {
  kv.set(KEY, JSON.stringify(state));
}

export const useAppFlags = create<AppFlags>((set, get) => ({
  ...DEFAULTS,
  reloadFromStorage: () => set(load()),
  setOnboardingSeen: (version) => {
    set({ onboardingSeenVersion: version });
    persist({ onboardingSeenVersion: version, lastRole: get().lastRole, pendingDeepLink: get().pendingDeepLink });
  },
  setPendingDeepLink: (link) => {
    set({ pendingDeepLink: link });
    persist({ onboardingSeenVersion: get().onboardingSeenVersion, lastRole: get().lastRole, pendingDeepLink: link });
  },
}));
