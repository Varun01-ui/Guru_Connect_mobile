import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
}

// Mirrors the prototype's bar() helper: an optional back chevron + centered title.
export function TopBar({ title, onBack }: TopBarProps) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable style={styles.back} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 26, color: tokens.light.ink, marginTop: -2 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
});
