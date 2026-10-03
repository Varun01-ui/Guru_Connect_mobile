import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

// Pill used for board, subject and mode choices (the prototype's `.chip`).
export function Chip({ label, selected, onPress, disabled }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={[styles.chip, selected && styles.chipOn, disabled && styles.disabled]}
    >
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: tokens.light.line,
    backgroundColor: tokens.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: tokens.light.priSoft, borderColor: tokens.light.pri },
  disabled: { opacity: 0.5 },
  label: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  labelOn: { color: tokens.light.priInk },
});
