import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}

// One row of the prototype's grouped `.menu` list.
export function MenuItem({ icon, title, subtitle, onPress, danger, last }: MenuItemProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.row, !last && styles.divider]}>
      <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
        <Ionicons name={icon} size={18} color={danger ? tokens.light.bad : tokens.light.priInk} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, danger && { color: tokens.light.bad }]}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={tokens.light.ink3} /> : null}
    </Pressable>
  );
}

export function MenuGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { backgroundColor: tokens.light.surface, borderRadius: tokens.radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: tokens.light.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: tokens.light.line },
  iconBox: { width: 36, height: 36, borderRadius: 11, backgroundColor: tokens.light.priSoft, alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { backgroundColor: tokens.light.badSoft },
  text: { flex: 1 },
  title: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  subtitle: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 1 },
});
