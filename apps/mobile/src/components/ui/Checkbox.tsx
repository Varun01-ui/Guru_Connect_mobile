import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <Text style={styles.check}>✓</Text> : null}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: tokens.light.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  boxChecked: { backgroundColor: tokens.light.pri, borderColor: tokens.light.pri },
  check: { color: tokens.light.onPrimary, fontSize: 12, fontFamily: tokens.font.bodyBold },
  label: { flex: 1, fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
});
