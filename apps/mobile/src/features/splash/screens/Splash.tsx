import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useBootstrapQuery } from '../../platform/hooks';
import { useAppFlags } from '../../../lib/appFlags.store';
import { readRefreshToken, restoreSession } from '../../../lib/api';
import { decideSplashRoute } from '../gating';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function Splash({ navigation }: Props) {
  const bootstrap = useBootstrapQuery();
  const onboardingSeenVersion = useAppFlags((s) => s.onboardingSeenVersion);

  useEffect(() => {
    if (!bootstrap.data) return;
    (async () => {
      const refreshToken = await readRefreshToken();
      let route = decideSplashRoute(bootstrap.data!, !!refreshToken, onboardingSeenVersion);
      if (route === 'Home') {
        const restored = await restoreSession();
        if (restored === 'signed_out') route = 'Login';
        else if (restored === 'offline') {
          navigation.replace('NoConnection');
          return;
        }
      }
      navigation.replace(route as any);
    })();
  }, [bootstrap.data, onboardingSeenVersion, navigation]);

  useEffect(() => {
    if (bootstrap.isError && !bootstrap.data) {
      navigation.replace('NoConnection');
    }
  }, [bootstrap.isError, bootstrap.data, navigation]);

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
  wordmark: { fontSize: 26, fontFamily: tokens.font.display, color: tokens.light.pri },
  tagline: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 6 },
  spinner: { marginTop: 24 },
});
