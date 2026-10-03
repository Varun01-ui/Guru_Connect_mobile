import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

const TOTAL_STEPS = 7;

export function RegistrationProgressHeader({ step, title, onBack }: { step: number; title: string; onBack?: () => void }) {
  return (
    <View>
      <TopBar title={title} onBack={onBack} />
      <View style={styles.row}>
        <Text style={styles.label}>
          Step {step} of {TOTAL_STEPS}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, paddingBottom: 14 },
  label: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3, marginBottom: 6 },
  track: { height: 6, borderRadius: tokens.radii.pill, backgroundColor: tokens.light.surface3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: tokens.light.pri, borderRadius: tokens.radii.pill },
});
