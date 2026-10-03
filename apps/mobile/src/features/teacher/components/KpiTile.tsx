import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

export function KpiTile({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  const deltaText = delta == null ? null : `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(0)}%`;
  const deltaColor = delta == null ? tokens.light.ink3 : delta >= 0 ? tokens.light.good : tokens.light.bad;
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {deltaText ? <Text style={[styles.delta, { color: deltaColor }]}>{deltaText}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '48%', flexGrow: 1, gap: 4 },
  label: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3 },
  value: { fontSize: 20, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  delta: { fontSize: 11, fontFamily: tokens.font.bodySemi },
});
