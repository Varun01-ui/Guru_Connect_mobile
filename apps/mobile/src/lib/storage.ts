import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Small synchronous key/value store used for app flags, drafts and the query
// cache. Reads come from an in-memory map; writes go through to AsyncStorage.
// Call hydrateStorage() once at startup, before anything reads from it.
// (Runs in Expo Go, which react-native-mmkv does not.)
const PREFIX = 'gc:kv:';
const cache = new Map<string, string>();

export const kv = {
  getString(key: string): string | undefined {
    return cache.get(key);
  },
  set(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(PREFIX + key, value).catch(() => {});
  },
  remove(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(PREFIX + key).catch(() => {});
  },
};

export async function hydrateStorage(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [k, v] of pairs) {
    if (v != null) cache.set(k.slice(PREFIX.length), v);
  }
}

// expo-secure-store has no web implementation (no OS keychain in a browser).
// Devices use the native keychain/keystore; web preview uses an in-memory map.
const webStore = new Map<string, string>();

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webStore.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
