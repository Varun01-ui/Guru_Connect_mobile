import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, Avatar, Card, Chip } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { useTeacherProfilePreviewQuery } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherProfilePreview'>;

export function TeacherProfilePreview({ navigation }: Props) {
  const preview = useTeacherProfilePreviewQuery();
  const p = preview.data;

  return (
    <View style={styles.container}>
      <TopBar title="Preview" onBack={() => navigation.goBack()} />
      {p ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.banner, p.visibleToParents ? styles.bannerGood : styles.bannerWarn]}>
            <Text style={[styles.bannerText, { color: p.visibleToParents ? tokens.light.good : tokens.light.warn }]}>
              {p.visibleToParents ? 'This is how parents see your profile' : 'Preview only — not visible until you are approved'}
            </Text>
          </View>

          <View style={styles.header}>
            <Avatar name={p.teacher.fullName} uri={p.teacher.photoUrl} size={64} radius={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.teacher.fullName}</Text>
              <Text style={styles.category}>{p.teacher.categoryName}</Text>
              {p.teacher.isVerifiedBadge ? <Text style={styles.verified}>✓ Verified</Text> : null}
            </View>
          </View>

          {p.teacher.bio ? <Text style={styles.bio}>{p.teacher.bio}</Text> : null}

          <View style={styles.chipWrap}>
            {p.subjects.map((s) => (
              <Chip key={s.subjectId} label={s.name} selected={s.isPrimary} />
            ))}
          </View>

          <Card style={styles.row}>
            <Text style={styles.rowLabel}>Classes</Text>
            <Text style={styles.rowValue}>{p.classes.map((c) => c.name).join(', ') || '—'}</Text>
          </Card>
          <Card style={styles.row}>
            <Text style={styles.rowLabel}>Teaching modes</Text>
            <Text style={styles.rowValue}>{p.teachingModes.map((m) => m.name).join(', ') || '—'}</Text>
          </Card>
          <Card style={styles.row}>
            <Text style={styles.rowLabel}>Fee</Text>
            <Text style={styles.rowValue}>{p.teacher.feePerHourPaise ? `₹${Math.round(p.teacher.feePerHourPaise / 100)}/hour` : '—'}</Text>
          </Card>
          <Card style={styles.row}>
            <Text style={styles.rowLabel}>Availability</Text>
            <Text style={styles.rowValue}>{p.availability.weeklySlots} weekly slots</Text>
          </Card>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  banner: { padding: 12, borderRadius: tokens.radii.lg, marginBottom: 16 },
  bannerGood: { backgroundColor: tokens.light.goodSoft },
  bannerWarn: { backgroundColor: tokens.light.warnSoft },
  bannerText: { fontSize: 13, fontFamily: tokens.font.bodySemi },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  name: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  category: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 2 },
  verified: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.verified, marginTop: 2 },
  bio: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, marginBottom: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3 },
  rowValue: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink, flex: 1, textAlign: 'right', marginLeft: 12 },
});
