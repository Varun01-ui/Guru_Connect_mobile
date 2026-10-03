import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ErrorBoundary } from './src/core/providers/ErrorBoundary';
import { RootNavigator } from './src/core/navigation/RootNavigator';
import { queryClient, persister } from './src/lib/queryClient';
import { hydrateStorage } from './src/lib/storage';
import { useAppFlags } from './src/lib/appFlags.store';
import { useChildSwitcher } from './src/features/children/hooks';
import './src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    hydrateStorage()
      .catch(() => {})
      .finally(() => {
        useAppFlags.getState().reloadFromStorage();
        useChildSwitcher.getState().reloadFromStorage();
        setStorageReady(true);
      });
  }, []);

  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded || !storageReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}>
              <RootNavigator />
            </PersistQueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}
