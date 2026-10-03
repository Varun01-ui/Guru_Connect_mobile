import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Avatar, Button, Card, ErrorState } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { tokens } from '../../../theme/tokens';
import { useSession } from '../../../lib/session.store';
import { useChildSwitcher } from '../../children/hooks';
import { useMeQuery } from '../../platform/hooks';
import { useProfileQuery } from '../../profile/hooks';
import type { Banner, RailCode } from '../api';
import { BannerCarousel } from '../components/BannerCarousel';
import { InstituteCard } from '../components/InstituteCard';
import { RailSection } from '../components/RailSection';
import { TeacherCard } from '../components/TeacherCard';
import { firstName } from '../format';
import { useParentHome } from '../hooks';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function comingSoon(what: string) {
  Alert.alert('Coming soon', `${what} isn't built yet.`);
}

export function ParentHome() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const signedIn = !!useSession((s) => s.accessToken);
  const selectedChildId = useChildSwitcher((s) => s.selectedChildId);
  const select = useChildSwitcher((s) => s.select);

  const me = useMeQuery(signedIn);
  const profile = useProfileQuery(signedIn);
  const home = useParentHome(selectedChildId);
  const data = home.data;

  // Keep the switcher in step with what the server says is selected (first launch,
  // or the remembered child was deleted on another device).
  useEffect(() => {
    if (!data) return;
    const stillExists = data.children.some((c) => c.id === selectedChildId);
    if ((!selectedChildId || !stillExists) && data.selectedChildId !== selectedChildId) select(data.selectedChildId);
  }, [data, selectedChildId, select]);

  // A remembered child that no longer exists (deleted, or from another account) makes the
  // server answer 403 for every request. Drop it and load the default child instead.
  const rejectedChild = home.error instanceof ApiError && home.error.code === 'FORBIDDEN' && !!selectedChildId;
  useEffect(() => {
    if (rejectedChild) select(null);
  }, [rejectedChild, select]);

  const child = data?.children.find((c) => c.id === (data.selectedChildId ?? selectedChildId));
  const childName = child?.childName ?? 'your child';
  const openManage = () => navigation.navigate('ChildrenSetup', { mode: 'manage' });
  const openRail = (rail: RailCode, title: string) => navigation.navigate('RailList', { rail, title, childId: child?.id });

  function onBanner(b: Banner) {
    if (b.deepLink?.startsWith('http')) Linking.openURL(b.deepLink).catch(() => {});
    else comingSoon('That page');
  }

  if (home.isError && !data && !rejectedChild) {
    return (
      <View style={styles.container}>
        <ErrorState title="Couldn't load your home" body="Check your connection and try again." onRetry={() => home.refetch()} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={tokens.light.pri} />
      </View>
    );
  }

  const location = [profile.data?.area?.name, profile.data?.city?.name].filter(Boolean).join(', ');
  const greetingName = firstName(me.data?.name ?? profile.data?.fullName);
  const hasChildren = data.children.length > 0;
  const rails = data.rails;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} tintColor={tokens.light.pri} />}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            {location ? (
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={14} color={tokens.light.heroInk} />
                <Text style={styles.loc}>{location}</Text>
              </View>
            ) : null}
            <Text style={styles.greeting}>{greetingName ? `Hi ${greetingName}, who are we looking for today?` : 'Who are we looking for today?'}</Text>
          </View>
          <Pressable style={styles.bell} onPress={() => comingSoon('Notifications')} accessibilityRole="button" accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            {(profile.data?.unreadNotifications ?? 0) > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        <Pressable style={styles.search} onPress={() => comingSoon('Search')} accessibilityRole="button">
          <Ionicons name="search-outline" size={18} color={tokens.light.heroInk} />
          <Text style={styles.searchText}>Subject, class, teacher or institute</Text>
          <Ionicons name="options-outline" size={18} color={tokens.light.heroInk} />
        </Pressable>

        {hasChildren ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.showing}>Showing recommendations for</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {data.children.map((c) => {
                const active = c.id === child?.id;
                return (
                  <Pressable key={c.id} onPress={() => select(c.id)} style={[styles.kidChip, active && styles.kidChipOn]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                    <Avatar name={c.childName} size={28} />
                    <View>
                      <Text style={[styles.kidName, active && { color: tokens.light.hero }]}>{c.childName}</Text>
                      <Text style={[styles.kidClass, active && { color: tokens.light.ink3 }]}>{c.classLabel}</Text>
                    </View>
                  </Pressable>
                );
              })}
              <Pressable onPress={openManage} style={styles.kidChip} accessibilityRole="button">
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.kidName}>{data.children.length < 3 ? 'Add' : 'Edit'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {!hasChildren ? (
          <Card style={styles.noKids}>
            <Text style={styles.noKidsTitle}>Add your first child</Text>
            <Text style={styles.noKidsBody}>Tell us their class and subjects so we can match the right teachers.</Text>
            <Button title="Add child" onPress={openManage} />
          </Card>
        ) : null}

        <BannerCarousel banners={data.banners.home_top} onPress={onBanner} />

        {hasChildren ? (
          <>
            <RailSection
              title={`Top picks for ${childName}`}
              items={rails.recommended_teachers?.items}
              keyOf={(t) => t.teacherId}
              renderItem={(t) => <TeacherCard teacher={t} onPress={() => comingSoon('Teacher profiles')} />}
              onSeeAll={() => openRail('recommended_teachers', `Top picks for ${childName}`)}
              empty={{ message: `No matches yet — try widening ${childName}'s subjects.`, actionLabel: 'Update preferences', onAction: openManage }}
            />
            <RailSection
              title={`Institutes for ${childName}`}
              items={rails.recommended_institutes?.items}
              keyOf={(i) => i.instituteId}
              renderItem={(i) => <InstituteCard institute={i} onPress={() => comingSoon('Institute profiles')} />}
              onSeeAll={() => openRail('recommended_institutes', `Institutes for ${childName}`)}
              empty={{ message: 'No institutes to show near you yet.' }}
            />
          </>
        ) : null}

        <BannerCarousel banners={data.banners.home_middle} onPress={onBanner} />

        <RailSection
          title="Top rated"
          items={rails.top_rated_teachers?.items}
          keyOf={(t) => t.teacherId}
          renderItem={(t) => <TeacherCard teacher={t} onPress={() => comingSoon('Teacher profiles')} />}
          onSeeAll={() => openRail('top_rated_teachers', 'Top rated')}
          empty={{ message: 'Top rated teachers will show up here once they have reviews.' }}
        />
        <RailSection
          title="Verified teachers"
          items={rails.verified_teachers?.items}
          keyOf={(t) => t.teacherId}
          renderItem={(t) => <TeacherCard teacher={t} onPress={() => comingSoon('Teacher profiles')} />}
          onSeeAll={() => openRail('verified_teachers', 'Verified teachers')}
          empty={{ message: 'No verified teachers in your city yet.' }}
        />
        <RailSection
          title="Nearby teachers"
          subtitle={profile.data?.area?.name ? `Near ${profile.data.area.name}` : profile.data?.city?.name ? `Near ${profile.data.city.name}` : undefined}
          items={rails.nearby_teachers?.items}
          keyOf={(t) => t.teacherId}
          renderItem={(t) => <TeacherCard teacher={t} onPress={() => comingSoon('Teacher profiles')} />}
          onSeeAll={() => openRail('nearby_teachers', 'Nearby teachers')}
          empty={{ message: 'No teachers listed near you yet.' }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 28 },
  hero: {
    backgroundColor: tokens.light.hero,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
    borderBottomLeftRadius: tokens.radii.xl,
    borderBottomRightRadius: tokens.radii.xl,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loc: { fontSize: 12.5, fontFamily: tokens.font.bodySemi, color: tokens.light.heroInk },
  greeting: { fontSize: 21, lineHeight: 27, fontFamily: tokens.font.display, color: '#fff', marginTop: 4 },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f87171' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchText: { flex: 1, fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.heroInk },
  showing: { fontSize: 12.5, fontFamily: tokens.font.bodySemi, color: tokens.light.heroInk, opacity: 0.9 },
  chips: { gap: 8 },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  kidChipOn: { backgroundColor: '#fff', borderColor: '#fff' },
  kidName: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: '#fff' },
  kidClass: { fontSize: 11, fontFamily: tokens.font.body, color: 'rgba(255,255,255,0.75)' },
  body: { padding: 20, gap: 24 },
  noKids: { gap: 10 },
  noKidsTitle: { fontSize: 17, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  noKidsBody: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
});
