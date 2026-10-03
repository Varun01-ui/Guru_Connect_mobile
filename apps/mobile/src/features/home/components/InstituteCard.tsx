import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui';
import { mediaUrl } from '../../../lib/media';
import { tokens } from '../../../theme/tokens';
import type { InstituteCardData } from '../api';

interface Props {
  institute: InstituteCardData;
  onPress: () => void;
  variant?: 'rail' | 'grid';
}

export function InstituteCard({ institute, onPress, variant = 'rail' }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.card, variant === 'rail' ? styles.rail : styles.grid]}>
      <View style={styles.top}>
        {institute.logoUrl ? <Image source={{ uri: mediaUrl(institute.logoUrl)! }} style={styles.logo} /> : <Avatar name={institute.name} size={44} radius={12} />}
        {institute.isPremium ? (
          <View style={styles.premium}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {institute.name}
      </Text>
      <View style={styles.metaRow}>
        {institute.overallRating != null ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={tokens.light.star} />
            <Text style={styles.ratingText}>{institute.overallRating.toFixed(1)}</Text>
          </View>
        ) : null}
        {institute.teacherCount != null ? <Text style={styles.count}>{institute.teacherCount} teachers</Text> : null}
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
    padding: 12,
    gap: 8,
  },
  rail: { width: 190 },
  grid: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 44, height: 44, borderRadius: 12 },
  premium: { backgroundColor: tokens.light.warnSoft, borderRadius: tokens.radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText: { fontSize: 10.5, fontFamily: tokens.font.bodyBold, color: tokens.light.warn },
  name: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, minHeight: 36 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  count: { fontSize: 11.5, fontFamily: tokens.font.body, color: tokens.light.ink3 },
});
