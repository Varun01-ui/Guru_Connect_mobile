import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colorFor, initials } from '../../../components/ui';
import { mediaUrl } from '../../../lib/media';
import { tokens } from '../../../theme/tokens';
import type { TeacherCardData } from '../api';
import { formatFeePerHour, formatRating } from '../format';

interface Props {
  teacher: TeacherCardData;
  onPress: () => void;
  variant?: 'rail' | 'grid';
}

// Mirrors the prototype's `.tc` card: photo block, name + verified tick, category,
// rating and trust score, then fee and distance.
export function TeacherCard({ teacher, onPress, variant = 'rail' }: Props) {
  const color = colorFor(teacher.fullName);
  const rating = formatRating(teacher.ratingAvg, teacher.ratingCount);
  const place = teacher.distanceLabel ?? teacher.areaLabel;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.card, variant === 'rail' ? styles.rail : styles.grid]}>
      <View style={[styles.photo, { backgroundColor: color }]}>
        {teacher.photoUrl ? <Image source={{ uri: mediaUrl(teacher.photoUrl)! }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={styles.initials}>{initials(teacher.fullName)}</Text>}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {teacher.fullName}
          </Text>
          {teacher.isVerifiedBadge ? <Ionicons name="checkmark-circle" size={15} color={tokens.light.verified} /> : null}
        </View>
        {teacher.categoryName ? (
          <Text style={styles.category} numberOfLines={1}>
            {teacher.categoryName}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {rating ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={tokens.light.star} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : (
            <Text style={styles.category}>New</Text>
          )}
          {teacher.trustScore != null ? (
            <View style={styles.trust}>
              <Ionicons name="shield-checkmark" size={11} color={tokens.light.good} />
              <Text style={styles.trustText}>{Math.round(teacher.trustScore)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.fee}>{formatFeePerHour(teacher.feePerHourPaise)}</Text>
          {place ? <Text style={styles.place}>{place}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.light.surface,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.light.line,
    overflow: 'hidden',
  },
  rail: { width: 176 },
  grid: { flex: 1 },
  photo: { height: 104, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 30, fontFamily: tokens.font.display, color: 'rgba(255,255,255,0.92)' },
  body: { padding: 10, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, fontSize: 13.5, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  category: { fontSize: 11.5, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: tokens.light.goodSoft, borderRadius: tokens.radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  trustText: { fontSize: 11, fontFamily: tokens.font.bodyBold, color: tokens.light.good },
  fee: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  place: { flexShrink: 1, fontSize: 11, fontFamily: tokens.font.body, color: tokens.light.ink3 },
});
