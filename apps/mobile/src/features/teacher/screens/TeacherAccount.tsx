import React from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Avatar, MenuGroup, MenuItem } from '../../../components/ui';
import { signOut } from '../../../lib/auth';
import { tokens } from '../../../theme/tokens';
import { useTeacherProfileQuery } from '../hooks';

export function TeacherAccount() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useTeacherProfileQuery();
  const t = profile.data?.teacher;

  function confirmSignOut() {
    Alert.alert('Sign out of GuruConnect?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Avatar name={t?.fullName ?? ''} uri={t?.photoUrl ?? undefined} size={56} radius={18} />
        <View>
          <Text style={styles.name}>{t?.fullName ?? ''}</Text>
          <Text style={styles.sub}>Teacher account</Text>
        </View>
      </View>
      <MenuGroup>
        <MenuItem icon="person-outline" title="My profile" onPress={() => navigation.navigate('TeacherProfileTab' as never)} />
        <MenuItem icon="calendar-outline" title="Availability" onPress={() => navigation.navigate('TeacherAvailability')} last />
      </MenuGroup>
      <View style={{ height: 12 }} />
      <MenuGroup>
        <MenuItem icon="log-out-outline" title="Sign out" danger onPress={confirmSignOut} last />
      </MenuGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  name: { fontSize: 16, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  sub: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 2 },
});
