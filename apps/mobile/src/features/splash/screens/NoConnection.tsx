import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
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
  title: { fontSize: 20, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginBottom: 24 },
});
