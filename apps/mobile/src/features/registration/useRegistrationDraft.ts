import { useCallback, useState } from 'react';
import { kv } from '../../lib/storage';

const TTL_MS = 24 * 60 * 60 * 1000;

function key(role: string, tokenSubjectHash: string) {
  return `registrationDraft:${role}:${tokenSubjectHash}`;
}

function load<T>(role: string, tokenSubjectHash: string): Partial<T> {
  const raw = kv.getString(key(role, tokenSubjectHash));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as { savedAt: number; data: Partial<T> };
    if (Date.now() - parsed.savedAt > TTL_MS) return {};
    return parsed.data;
  } catch {
    return {};
  }
}

// Persists a per-role registration draft to MMKV so the form survives an app
// restart mid-fill (Review Focus: backgrounding the app during ParentRegistration
// must not lose typed fields).
export function useRegistrationDraft<T extends object>(role: string, tokenSubjectHash: string) {
  const [draft, setDraft] = useState<Partial<T>>(() => load<T>(role, tokenSubjectHash));

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [field]: value };
        kv.set(key(role, tokenSubjectHash), JSON.stringify({ savedAt: Date.now(), data: next }));
        return next;
      });
    },
    [role, tokenSubjectHash],
  );

  const clearDraft = useCallback(() => {
    kv.remove(key(role, tokenSubjectHash));
    setDraft({});
  }, [role, tokenSubjectHash]);

  return [draft, updateField, clearDraft] as const;
}
