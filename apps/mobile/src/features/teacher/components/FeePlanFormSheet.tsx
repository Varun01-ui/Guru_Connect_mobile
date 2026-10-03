import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { TextField, Select, Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { FeePlan, FeePlanInput, FeeUnit, SubjectRow, ClassRow, ModeRow } from '../api';
import { formatFee, toPaise } from '../rules';

const UNITS: { label: string; value: FeeUnit }[] = [
  { label: 'Per hour', value: 'per_hour' },
  { label: 'Per month', value: 'per_month' },
  { label: 'Per course', value: 'per_course' },
];

interface Props {
  visible: boolean;
  initial?: FeePlan | null;
  subjects: SubjectRow[];
  classes: ClassRow[];
  modes: ModeRow[];
  onCancel: () => void;
  onSave: (body: FeePlanInput) => void;
  saving: boolean;
}

export function FeePlanFormSheet({ visible, initial, subjects, classes, modes, onCancel, onSave, saving }: Props) {
  const [label, setLabel] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [classFromId, setClassFromId] = useState<string | undefined>();
  const [classToId, setClassToId] = useState<string | undefined>();
  const [teachingModeId, setTeachingModeId] = useState<string | undefined>();
  const [feeUnit, setFeeUnit] = useState<FeeUnit>('per_hour');
  const [amount, setAmount] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState('1');
  const [sessionMinutes, setSessionMinutes] = useState('60');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLabel(initial?.label ?? '');
    setSubjectId(initial?.subjectId ?? undefined);
    setClassFromId(initial?.classFromId ?? undefined);
    setClassToId(initial?.classToId ?? undefined);
    setTeachingModeId(initial?.teachingModeId ?? undefined);
    setFeeUnit(initial?.feeUnit ?? 'per_hour');
    setAmount(formatFee(initial?.amountPaise));
    setSessionsPerWeek(initial?.sessionsPerWeek ? String(initial.sessionsPerWeek) : '1');
    setSessionMinutes(initial?.sessionMinutes ? String(initial.sessionMinutes) : '60');
    setNotes(initial?.notes ?? '');
  }, [visible, initial]);

  const amountPaise = toPaise(amount);
  const canSave = label.trim().length >= 2 && !!amountPaise;

  function handleSave() {
    onSave({
      label: label.trim(),
      subjectId: subjectId ?? null,
      classFromId: classFromId ?? null,
      classToId: classToId ?? null,
      teachingModeId: teachingModeId ?? null,
      feeUnit,
      amountPaise: amountPaise!,
      sessionsPerWeek: feeUnit === 'per_hour' ? null : Number(sessionsPerWeek),
      sessionMinutes: feeUnit === 'per_hour' ? Number(sessionMinutes) : null,
      notes: notes.trim() || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{initial ? 'Edit fee plan' : 'Add fee plan'}</Text>
            <TextField label="Label" placeholder="JEE Physics batch" value={label} onChangeText={setLabel} />
            {subjects.length > 0 ? (
              <Select label="Subject (optional)" options={subjects.map((s) => ({ label: s.name, value: s.subjectId }))} value={subjectId} onChange={setSubjectId} />
            ) : null}
            {classes.length > 0 ? (
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Select label="From class" options={classes.map((c) => ({ label: c.name, value: c.classId }))} value={classFromId} onChange={setClassFromId} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Select label="To class" options={classes.map((c) => ({ label: c.name, value: c.classId }))} value={classToId} onChange={setClassToId} />
                </View>
              </View>
            ) : null}
            {modes.length > 0 ? (
              <Select label="Teaching mode (optional)" options={modes.map((m) => ({ label: m.name, value: m.teachingModeId }))} value={teachingModeId} onChange={setTeachingModeId} />
            ) : null}
            <Text style={styles.label}>Fee unit</Text>
            <View style={styles.segmented}>
              {UNITS.map((u) => (
                <Pressable key={u.value} style={[styles.segment, feeUnit === u.value && styles.segmentOn]} onPress={() => setFeeUnit(u.value)}>
                  <Text style={[styles.segmentText, feeUnit === u.value && styles.segmentTextOn]}>{u.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label="Amount (₹)" keyboardType="number-pad" value={amount} onChangeText={setAmount} />
            {feeUnit === 'per_hour' ? (
              <TextField label="Session length (minutes)" keyboardType="number-pad" value={sessionMinutes} onChangeText={setSessionMinutes} />
            ) : (
              <TextField label="Sessions per week" keyboardType="number-pad" value={sessionsPerWeek} onChangeText={setSessionsPerWeek} />
            )}
            <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} />
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
  sheet: { maxHeight: '88%', backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.xl, borderTopRightRadius: tokens.radii.xl },
  content: { padding: 20 },
  heading: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 16 },
  row2: { flexDirection: 'row' },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 8, fontFamily: tokens.font.bodySemi },
  segmented: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segment: { flex: 1, height: 40, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: tokens.light.priSoft, borderColor: tokens.light.pri },
  segmentText: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  segmentTextOn: { color: tokens.light.priInk },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line },
});
