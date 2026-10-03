import React from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Card } from '../../../components/ui';
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
      navigation.replace('Login');
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
              <Text style={styles.deviceLabel}>
                {item.deviceLabel}
                {item.isCurrent ? ' · This device' : ''}
              </Text>
              <Text style={styles.lastUsed}>{item.lastUsedAt}</Text>
            </View>
            {!item.isCurrent ? (
              <Text style={styles.signOut} onPress={() => revoke.mutate(item.id)}>
                Sign out
              </Text>
            ) : null}
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
  deviceLabel: { fontSize: 15, fontFamily: tokens.font.bodySemi, color: tokens.light.ink },
  lastUsed: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 2 },
  signOut: { fontSize: 14, fontFamily: tokens.font.bodySemi, color: tokens.light.bad },
  dangerLink: { textAlign: 'center', fontSize: 14, fontFamily: tokens.font.bodySemi, color: tokens.light.bad, marginTop: 16 },
});
