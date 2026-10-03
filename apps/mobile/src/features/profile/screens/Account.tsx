import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Avatar, Card, ErrorState, MenuGroup, MenuItem } from '../../../components/ui';
import { signOut } from '../../../lib/auth';
import { tokens } from '../../../theme/tokens';
import { useChildrenQuery } from '../../children/hooks';
import { formatMemberSince } from '../../home/format';
import { useBootstrapQuery } from '../../platform/hooks';
import { useProfileQuery } from '../hooks';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The Account tab (prototype 'account'): profile summary, then grouped menu rows.
export function Account() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const profile = useProfileQuery();
  const children = useChildrenQuery();
  const bootstrap = useBootstrapQuery();
  const legal = bootstrap.data?.legal;
  const soon = (what: string) => () => Alert.alert('Coming soon', `${what} isn't built yet.`);
  const open = (url: string | undefined) => () => url && Linking.openURL(url).catch(() => {});

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

  if (profile.isError && !profile.data) {
    return (
      <View style={styles.container}>
        <ErrorState title="Couldn't load your profile" body="Check your connection and try again." onRetry={() => profile.refetch()} />
      </View>
    );
  }
  if (!profile.data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={tokens.light.pri} />
      </View>
    );
  }

  const p = profile.data;
  const location = [p.area?.name, p.city?.name].filter(Boolean).join(' · ');
  const since = formatMemberSince(p.memberSince);
  const kidsSummary = (children.data ?? []).map((c) => `${c.childName} · ${c.class?.name ?? ''}`.trim()).join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.screenTitle}>Account</Text>

      <Card style={styles.header}>
        <Avatar name={p.fullName} size={64} uri={p.photoUrl} />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {p.fullName}
          </Text>
          <Text style={styles.meta}>{p.phoneMasked}</Text>
          {location ? <Text style={styles.meta}>{location}</Text> : null}
          {since ? <Text style={styles.meta}>Member since {since}</Text> : null}
        </View>
        <Pressable onPress={() => navigation.navigate('EditProfile')} accessibilityRole="button" accessibilityLabel="Edit profile" hitSlop={10} style={styles.edit}>
          <Ionicons name="create-outline" size={20} color={tokens.light.priInk} />
        </Pressable>
      </Card>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {p.childrenCount} {p.childrenCount === 1 ? 'child' : 'children'}
          </Text>
        </View>
      </View>

      <MenuGroup>
        <MenuItem icon="people-outline" title="My children" subtitle={kidsSummary || 'Add your children'} onPress={() => navigation.navigate('ChildrenSetup', { mode: 'manage' })} />
        <MenuItem icon="ribbon-outline" title="Membership" onPress={soon('Membership')} />
        <MenuItem icon="wallet-outline" title="Payments & rewards" subtitle="History, invoices, wallet" onPress={soon('Payments')} />
        <MenuItem icon="gift-outline" title="Refer & earn" onPress={soon('Refer & earn')} />
        <MenuItem icon="notifications-outline" title="Notifications" subtitle="Inbox" onPress={soon('Notifications')} last />
      </MenuGroup>

      <MenuGroup>
        <MenuItem icon="person-outline" title="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <MenuItem icon="phone-portrait-outline" title="Active sessions" subtitle="Devices signed in to your account" onPress={() => navigation.navigate('ActiveSessions')} />
        <MenuItem icon="options-outline" title="Notification settings" onPress={soon('Notification settings')} />
        <MenuItem icon="eye-outline" title="Privacy settings" onPress={soon('Privacy settings')} last />
      </MenuGroup>

      <MenuGroup>
        <MenuItem icon="help-circle-outline" title="Help center" onPress={soon('Help center')} />
        <MenuItem icon="chatbubble-outline" title="Contact support" onPress={soon('Support')} />
        <MenuItem icon="document-text-outline" title="Terms & conditions" onPress={open(legal?.termsUrl)} />
        <MenuItem icon="lock-closed-outline" title="Privacy policy" onPress={open(legal?.privacyUrl)} last />
      </MenuGroup>

      <MenuGroup>
        <MenuItem icon="log-out-outline" title="Log out" onPress={confirmSignOut} danger />
        <MenuItem icon="trash-outline" title="Delete account" onPress={soon('Account deletion')} danger last />
      </MenuGroup>

      <Text style={styles.version}>GuruConnect 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  screenTitle: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  meta: { fontSize: 12.5, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  edit: { width: 38, height: 38, borderRadius: 19, backgroundColor: tokens.light.priSoft, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 8, marginTop: -4 },
  chip: { backgroundColor: tokens.light.priSoft, borderRadius: tokens.radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12.5, fontFamily: tokens.font.bodyBold, color: tokens.light.priInk },
  version: { textAlign: 'center', fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3 },
});
