import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../../theme/tokens';
import type { DisplayStatus } from '../api';

const CONFIG: Record<DisplayStatus, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; title: string }> = {
  pending: { icon: 'time-outline', color: tokens.light.warn, bg: tokens.light.warnSoft, title: 'Under review' },
  reupload_required: { icon: 'alert-circle', color: tokens.light.bad, bg: tokens.light.badSoft, title: 'Action needed' },
  approved: { icon: 'checkmark-circle', color: tokens.light.good, bg: tokens.light.goodSoft, title: "You're verified!" },
  rejected: { icon: 'close-circle', color: tokens.light.ink3, bg: tokens.light.surface3, title: 'Application not approved' },
};

export function StatusBanner({ displayStatus, subtitle }: { displayStatus: DisplayStatus; subtitle?: string }) {
  const c = CONFIG[displayStatus];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={22} color={c.color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.color }]}>{c.title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: tokens.radii.lg, marginBottom: 16 },
  title: { fontSize: 15, fontFamily: tokens.font.bodyBold },
  subtitle: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 2 },
});
