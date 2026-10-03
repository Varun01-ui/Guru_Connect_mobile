import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { Qualification } from '../api';

export function QualificationCard({ qualification, onEdit, onDelete }: { qualification: Qualification; onEdit: () => void; onDelete: () => void }) {
  const parts = [qualification.degree, qualification.institution, qualification.yearCompleted ? String(qualification.yearCompleted) : null, qualification.isHighest ? 'Highest' : null].filter(
    Boolean,
  );
  return (
    <Card style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {parts.join(' · ')}
        </Text>
      </View>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit" style={styles.iconBtn}>
        <Ionicons name="create-outline" size={18} color={tokens.light.ink2} />
      </Pressable>
      <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete" style={styles.iconBtn}>
        <Ionicons name="trash-outline" size={18} color={tokens.light.bad} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 14, fontFamily: tokens.font.bodySemi, color: tokens.light.ink },
  iconBtn: { padding: 6 },
});
