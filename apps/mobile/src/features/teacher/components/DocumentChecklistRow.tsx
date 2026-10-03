import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { DocumentRow } from '../api';

const TITLES: Record<string, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN card',
  education_certificate: 'Education certificate',
  professional_certificate: 'Professional certificate',
  experience_letter: 'Experience letter',
  photo: 'Verification photo',
};

function statusCopy(doc: DocumentRow | null | undefined): { label: string; color: string; bg: string } {
  if (!doc) return { label: 'Not uploaded', color: tokens.light.ink3, bg: tokens.light.surface3 };
  if (doc.status === 'approved') return { label: 'Approved', color: tokens.light.good, bg: tokens.light.goodSoft };
  if (doc.status === 'reupload_requested') return { label: 'Needs re-upload', color: tokens.light.bad, bg: tokens.light.badSoft };
  if (doc.status === 'rejected') return { label: 'Rejected', color: tokens.light.bad, bg: tokens.light.badSoft };
  return { label: 'Uploaded · under review', color: tokens.light.warn, bg: tokens.light.warnSoft };
}

export function DocumentChecklistRow({ docType, doc, onPress }: { docType: string; doc: DocumentRow | null | undefined; onPress: () => void }) {
  const status = statusCopy(doc);
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="document-text-outline" size={20} color={tokens.light.pri} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{TITLES[docType] ?? docType}</Text>
          {doc?.reviewNote ? (
            <Text style={styles.note} numberOfLines={2}>
              {doc.reviewNote}
            </Text>
          ) : null}
        </View>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.light.ink3} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: tokens.light.priSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  note: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: tokens.radii.pill },
  pillText: { fontSize: 11, fontFamily: tokens.font.bodySemi },
});
