import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export function StickyActionBar({ children }: { children: React.ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: { padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line, backgroundColor: tokens.light.surface },
});
