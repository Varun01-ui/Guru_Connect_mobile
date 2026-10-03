import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface OptionCardProps {
  label: string;
  icon: IconName;
  selected?: boolean;
  onPress?: () => void;
}

// Selectable tile for "type of teacher needed" (the prototype's `.opt` grid).
export function OptionCard({ label, icon, selected, onPress }: OptionCardProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} style={[styles.card, selected && styles.cardOn]}>
      <Ionicons name={icon} size={20} color={tokens.light.pri} />
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.light.line,
    backgroundColor: tokens.light.surface,
  },
  cardOn: { borderColor: tokens.light.pri, backgroundColor: tokens.light.priSoft },
  label: { fontSize: 12, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, textAlign: 'center' },
});
