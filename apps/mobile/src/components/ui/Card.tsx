import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.light.surface,
    borderRadius: tokens.radii.lg,
    padding: 16,
    shadowColor: '#15132e',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
