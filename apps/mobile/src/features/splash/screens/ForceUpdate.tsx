import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
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
  title: { fontSize: 20, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginBottom: 24 },
});
