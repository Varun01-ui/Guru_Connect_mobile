import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Avatar, Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { SaveChildrenResult } from '../hooks';

interface Props {
  visible: boolean;
  result: SaveChildrenResult | null;
  onDone: () => void;
}

// Shown after a save: the top matches for each child that was just created or changed.
export function PreviewSheet({ visible, result, onDone }: Props) {
  const groups = result?.previews ?? [];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            {groups.length === 0 ? (
              <>
                <Text style={styles.heading}>You're all set</Text>
                <Text style={styles.body}>We'll show matches for your children on Home.</Text>
              </>
            ) : (
              groups.map((g) => (
                <View key={g.childName} style={styles.group}>
                  <Text style={styles.heading}>
                    {g.items.length} teacher{g.items.length === 1 ? '' : 's'} found for {g.childName}
                  </Text>
                  {g.items.length === 0 ? (
                    <Text style={styles.body}>We'll notify you as soon as a match appears nearby.</Text>
                  ) : (
                    g.items.slice(0, 3).map((t) => (
                      <View key={t.teacherId} style={styles.teacher}>
                        <Avatar name={t.fullName} size={40} radius={12} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teacherName}>{t.fullName}</Text>
                          <Text style={styles.teacherMeta} numberOfLines={1}>
                            {[t.subjectsMatched.join(', '), t.distanceKm != null ? `${t.distanceKm} km` : null].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                        <View style={styles.trust}>
                          <Text style={styles.trustText}>{Math.round(t.trustScore)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ))
            )}
            {(result?.dropped ?? []).map((d) => (
              <Text key={d.childName} style={styles.note}>
                {d.childName}: removed {d.subjects.join(', ')} because it isn't offered for the new class.
              </Text>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Done" onPress={onDone} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '75%', backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.xl, borderTopRightRadius: tokens.radii.xl },
  content: { padding: 20, gap: 16 },
  group: { gap: 10 },
  heading: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherName: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  teacherMeta: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  trust: { backgroundColor: tokens.light.goodSoft, borderRadius: tokens.radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  trustText: { fontSize: 12, fontFamily: tokens.font.bodyBold, color: tokens.light.good },
  note: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.warn },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line },
});
