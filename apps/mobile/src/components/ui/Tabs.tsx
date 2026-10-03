import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: tokens.light.surface3, borderRadius: tokens.radii.pill, padding: 4, marginBottom: 20 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radii.pill },
  tabActive: { backgroundColor: tokens.light.surface },
  label: { fontSize: 14, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3 },
  labelActive: { color: tokens.light.ink },
});
