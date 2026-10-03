import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Avatar, MenuGroup, MenuItem, Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { useTeacherProfileQuery, useTeacherAvailabilityQuery } from '../hooks';

export function TeacherProfile() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useTeacherProfileQuery();
  const availability = useTeacherAvailabilityQuery();

  const t = profile.data?.teacher;
  const percent = profile.data?.completeness.percent ?? 0;
  const missing = (profile.data?.completeness.items ?? []).filter((i) => i.earned < i.of).sort((a, b) => b.of - a.of)[0];
  const weeklySlots = availability.data?.windows.length ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Avatar name={t?.fullName ?? ''} uri={t?.photoUrl ?? undefined} size={64} radius={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{t?.fullName ?? ''}</Text>
          {t?.isVerifiedBadge ? <Text style={styles.verified}>✓ Verified</Text> : null}
        </View>
      </View>

      <Card style={styles.completenessCard}>
        <Text style={styles.completenessTitle}>{percent}% complete</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        {missing ? (
          <Text style={styles.completenessHint}>
            Add {missing.label.toLowerCase()} for +{missing.of - missing.earned}%
          </Text>
        ) : null}
      </Card>

      <MenuGroup>
        <MenuItem icon="person-outline" title="About" subtitle="Photo, bio, languages" onPress={() => navigation.navigate('TeacherProfileAbout')} />
        <MenuItem icon="school-outline" title="Experience" subtitle="Years, qualification, fee" onPress={() => navigation.navigate('TeacherProfileExperience')} />
        <MenuItem icon="book-outline" title="Subjects" subtitle={`${profile.data?.subjects.length ?? 0} selected`} onPress={() => navigation.navigate('TeacherRegSubjects')} />
        <MenuItem icon="layers-outline" title="Classes" subtitle={`${profile.data?.classes.length ?? 0} selected`} onPress={() => navigation.navigate('TeacherRegClasses')} />
        <MenuItem icon="videocam-outline" title="Teaching modes" onPress={() => navigation.navigate('TeacherRegModes')} />
        <MenuItem icon="location-outline" title="Locations" onPress={() => navigation.navigate('TeacherRegLocations')} />
        <MenuItem icon="pricetag-outline" title="Fee plans" subtitle={`${profile.data?.feePlans.length ?? 0} plans`} onPress={() => navigation.navigate('TeacherFeePlans')} />
        <MenuItem icon="calendar-outline" title="Availability" subtitle={`${weeklySlots} slots this week`} onPress={() => navigation.navigate('TeacherAvailability')} last />
      </MenuGroup>

      <View style={{ height: 12 }} />
      <MenuGroup>
        <MenuItem icon="eye-outline" title="Preview my profile" onPress={() => navigation.navigate('TeacherProfilePreview')} last />
      </MenuGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  name: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  verified: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.verified, marginTop: 2 },
  completenessCard: { marginBottom: 16, gap: 8 },
  completenessTitle: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  progressTrack: { height: 8, borderRadius: tokens.radii.pill, backgroundColor: tokens.light.surface3, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: tokens.light.pri, borderRadius: tokens.radii.pill },
  completenessHint: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink2 },
});
