import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { TextField, Button } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSave: (body: { startsOn: string; endsOn: string; reason?: string; pauseLeads: boolean }) => void;
  saving: boolean;
  clash?: { requesterName: string; startAt: string }[] | null;
  onConfirmForce: () => void;
  onChangeDates: () => void;
}

export function TimeOffFormSheet({ visible, onCancel, onSave, saving, clash, onConfirmForce, onChangeDates }: Props) {
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [reason, setReason] = useState('');
  const [pauseLeads, setPauseLeads] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setStartsOn('');
    setEndsOn('');
    setReason('');
    setPauseLeads(true);
  }, [visible]);

  const canSave = /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && /^\d{4}-\d{2}-\d{2}$/.test(endsOn) && endsOn >= startsOn;

  if (clash) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.heading}>You have demos during this time</Text>
            {clash.map((d, i) => (
              <Text key={i} style={styles.clashRow}>
                {d.requesterName} · {new Date(d.startAt).toLocaleString()}
              </Text>
            ))}
            <Text style={styles.body}>If you continue, these will be cancelled and the families notified.</Text>
            <Button title="Cancel these demos & continue" variant="outline" onPress={onConfirmForce} loading={saving} />
            <View style={{ height: 10 }} />
            <Button title="Choose different dates" onPress={onChangeDates} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>Add time off</Text>
            <TextField label="Start date" placeholder="YYYY-MM-DD" value={startsOn} onChangeText={setStartsOn} />
            <TextField label="End date" placeholder="YYYY-MM-DD" value={endsOn} onChangeText={setEndsOn} />
            <TextField label="Reason (optional)" placeholder="Family trip" value={reason} onChangeText={setReason} />
            <Pressable style={styles.pauseRow} onPress={() => setPauseLeads((v) => !v)}>
              <View style={[styles.switchTrack, pauseLeads && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, pauseLeads && styles.switchThumbOn]} />
              </View>
              <Text style={styles.pauseLabel}>Pause new leads while I'm away</Text>
            </Pressable>
          </ScrollView>
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" variant="outline" onPress={onCancel} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Button title="Save" onPress={() => onSave({ startsOn, endsOn, reason: reason.trim() || undefined, pauseLeads })} disabled={!canSave} loading={saving} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', backgroundColor: tokens.light.surface, borderTopLeftRadius: tokens.radii.xl, borderTopRightRadius: tokens.radii.xl },
  dialog: { margin: 24, backgroundColor: tokens.light.surface, borderRadius: tokens.radii.lg, padding: 20 },
  content: { padding: 20 },
  heading: { fontSize: 18, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 12 },
  body: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2, marginVertical: 12 },
  clashRow: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink, marginBottom: 4 },
  pauseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  switchTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: tokens.light.surface3, padding: 2 },
  switchTrackOn: { backgroundColor: tokens.light.pri },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: tokens.light.surface },
  switchThumbOn: { marginLeft: 18 },
  pauseLabel: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2, flex: 1 },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: tokens.light.line },
});
