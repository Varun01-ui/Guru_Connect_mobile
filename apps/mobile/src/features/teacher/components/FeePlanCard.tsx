import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { FeePlan } from '../api';

const UNIT_LABEL: Record<string, string> = { per_hour: '/hour', per_month: '/month', per_course: '/course' };

export function FeePlanCard({ plan, onEdit, onDelete }: { plan: FeePlan; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{plan.label}</Text>
        <Text style={styles.amount}>
          ₹{Math.round(plan.amountPaise / 100)}
          {UNIT_LABEL[plan.feeUnit] ?? ''}
        </Text>
      </View>
      <Pressable onPress={onEdit} accessibilityLabel="Edit" style={styles.iconBtn}>
        <Ionicons name="create-outline" size={18} color={tokens.light.ink2} />
      </Pressable>
      <Pressable onPress={onDelete} accessibilityLabel="Delete" style={styles.iconBtn}>
        <Ionicons name="trash-outline" size={18} color={tokens.light.bad} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  amount: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 2 },
  iconBtn: { padding: 6 },
});
