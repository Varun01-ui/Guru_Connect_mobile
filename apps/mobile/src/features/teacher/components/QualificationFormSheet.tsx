import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { TextField, Select, Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { Qualification, QualificationInput, QualificationLevel } from '../api';

const LEVELS: { label: string; value: QualificationLevel }[] = [
  { label: 'Secondary', value: 'secondary' },
  { label: 'Senior secondary', value: 'senior_secondary' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'Graduate', value: 'graduate' },
  { label: 'Postgraduate', value: 'postgraduate' },
  { label: 'Doctorate', value: 'doctorate' },
  { label: 'Professional', value: 'professional' },
  { label: 'Certification', value: 'certification' },
];

interface Props {
  visible: boolean;
  initial?: Qualification | null;
  onCancel: () => void;
  onSave: (body: QualificationInput) => void;
  saving: boolean;
}

export function QualificationFormSheet({ visible, initial, onCancel, onSave, saving }: Props) {
  const [level, setLevel] = useState<QualificationLevel | undefined>();
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [year, setYear] = useState('');
  const [grade, setGrade] = useState('');
  const [isHighest, setIsHighest] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLevel(initial?.level);
    setDegree(initial?.degree ?? '');
    setInstitution(initial?.institution ?? '');
    setYear(initial?.yearCompleted ? String(initial.yearCompleted) : '');
    setGrade(initial?.grade ?? '');
    setIsHighest(initial?.isHighest ?? false);
  }, [visible, initial]);

  const canSave = !!level && degree.trim().length >= 2 && institution.trim().length >= 2;

  function handleSave() {
    onSave({
      level: level!,
      degree: degree.trim(),
      institution: institution.trim(),
      yearCompleted: year ? Number(year) : null,
      grade: grade.trim() || null,
      isHighest,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{initial ? 'Edit qualification' : 'Add qualification'}</Text>
            <Select label="Level" placeholder="Select a level" options={LEVELS} value={level} onChange={(v) => setLevel(v as QualificationLevel)} />
            <TextField label="Degree" placeholder="M.Sc. Physics" value={degree} onChangeText={setDegree} />
            <TextField label="Institution" placeholder="Bangalore University" value={institution} onChangeText={setInstitution} />
            <TextField label="Year completed" placeholder="2010" keyboardType="number-pad" value={year} onChangeText={setYear} />
            <TextField label="Grade (optional)" placeholder="First class" value={grade} onChangeText={setGrade} />
            <Pressable style={styles.highestRow} onPress={() => setIsHighest((v) => !v)}>
              <View style={[styles.switchTrack, isHighest && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, isHighest && styles.switchThumbOn]} />
              </View>
              <Text style={styles.highestLabel}>This is my highest qualification</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" variant="outline" onPress={onCancel} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Button title="Save" onPress={handleSave} disabled={!canSave} loading={saving} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.xl, borderTopRightRadius: tokens.radii.xl },
  content: { padding: 20 },
  heading: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 16 },
  highestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 },
  switchTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: tokens.light.surface3, padding: 2 },
  switchTrackOn: { backgroundColor: tokens.light.pri },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: tokens.light.surface },
  switchThumbOn: { marginLeft: 18 },
  highestLabel: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line },
});
