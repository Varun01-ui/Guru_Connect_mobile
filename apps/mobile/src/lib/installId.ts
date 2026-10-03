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
