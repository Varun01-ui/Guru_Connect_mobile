import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function Skeleton({ width, height }: { width: number | `${number}%`; height: number }) {
  return <View style={{ width, height, borderRadius: 8, backgroundColor: tokens.light.surface3 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 17, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, marginBottom: 6, textAlign: 'center' },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginBottom: 16 },
});
