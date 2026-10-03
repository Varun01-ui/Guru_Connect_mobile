import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { TopBar, Button, StickyActionBar, Card } from '../../../components/ui';
import { TimeOffFormSheet } from '../components/TimeOffFormSheet';
import { tokens } from '../../../theme/tokens';
import { ApiError } from '../../../lib/api';
import { useTeacherAvailabilityQuery, useSaveAvailabilityMutation, useAddTimeOffMutation, useDeleteTimeOffMutation } from '../hooks';
import { dayLabel, windowsOverlap } from '../rules';
import type { AvailabilityWindow } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAvailability'>;

interface WindowDraft {
  key: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  acceptsDemos: boolean;
}

export function TeacherAvailability({ navigation }: Props) {
  const availability = useTeacherAvailabilityQuery();
  const saveAvailability = useSaveAvailabilityMutation();
  const addTimeOff = useAddTimeOffMutation();
  const deleteTimeOff = useDeleteTimeOffMutation();

  const [windows, setWindows] = useState<WindowDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftByDay, setDraftByDay] = useState<Record<number, { start: string; end: string }>>({});
  const [error, setError] = useState<string | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [clash, setClash] = useState<{ requesterName: string; startAt: string }[] | null>(null);
  const [pendingTimeOff, setPendingTimeOff] = useState<{ startsOn: string; endsOn: string; reason?: string; pauseLeads: boolean } | null>(null);

  useEffect(() => {
    if (!availability.data || hydrated) return;
    setWindows(availability.data.windows.map((w: AvailabilityWindow) => ({ key: w.id, dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime, acceptsDemos: w.acceptsDemos })));
    setHydrated(true);
  }, [availability.data, hydrated]);

  function addWindow(day: number) {
    const draft = draftByDay[day];
    if (!draft?.start || !draft?.end) return;
    const candidate = { startTime: draft.start, endTime: draft.end };
    const sameDay = windows.filter((w) => w.dayOfWeek === day);
    if (sameDay.some((w) => windowsOverlap(w, candidate))) {
      setError('This overlaps another window on the same day');
      return;
    }
    if (sameDay.length >= 5) {
      setError('Up to 5 windows per day');
      return;
    }
    setError(undefined);
    setWindows((prev) => [...prev, { key: `${Date.now()}-${Math.random()}`, dayOfWeek: day, startTime: draft.start, endTime: draft.end, acceptsDemos: true }]);
    setDraftByDay((prev) => ({ ...prev, [day]: { start: '', end: '' } }));
    setDirty(true);
  }
  function removeWindow(key: string) {
    setWindows((prev) => prev.filter((w) => w.key !== key));
    setDirty(true);
  }

  async function onSaveGrid() {
    setError(undefined);
    try {
      await saveAvailability.mutateAsync(windows.map((w) => ({ dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime, acceptsDemos: w.acceptsDemos })));
      setDirty(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  async function onSaveTimeOff(body: { startsOn: string; endsOn: string; reason?: string; pauseLeads: boolean }) {
    try {
      await addTimeOff.mutateAsync({ body, idempotencyKey: `timeoff-${Date.now()}` });
      setSheetOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT_STATE') {
        setPendingTimeOff(body);
        setClash((err.details as any)?.affectedDemos ?? []);
      }
    }
  }
  async function onConfirmForce() {
    if (!pendingTimeOff) return;
    try {
      await addTimeOff.mutateAsync({ body: { ...pendingTimeOff, confirmForce: true }, idempotencyKey: `timeoff-${Date.now()}` });
      setClash(null);
      setPendingTimeOff(null);
      setSheetOpen(false);
    } catch {
      // stays on the dialog
    }
  }

  return (
    <View style={styles.container}>
      <TopBar title="Your availability" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <View key={day} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{dayLabel(day)}</Text>
            {windows
              .filter((w) => w.dayOfWeek === day)
              .map((w) => (
                <View key={w.key} style={styles.windowRow}>
                  <Text style={styles.windowText}>
                    {w.startTime} – {w.endTime}
                  </Text>
                  <Pressable onPress={() => removeWindow(w.key)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={tokens.light.bad} />
                  </Pressable>
                </View>
              ))}
            <View style={styles.addRow}>
              <TextInput
                style={styles.timeInput}
                placeholder="18:00"
                value={draftByDay[day]?.start ?? ''}
                onChangeText={(v) => setDraftByDay((prev) => ({ ...prev, [day]: { start: v, end: prev[day]?.end ?? '' } }))}
              />
              <Text style={styles.dash}>–</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="21:00"
                value={draftByDay[day]?.end ?? ''}
                onChangeText={(v) => setDraftByDay((prev) => ({ ...prev, [day]: { start: prev[day]?.start ?? '', end: v } }))}
              />
              <Pressable style={styles.addBtn} onPress={() => addWindow(day)}>
                <Ionicons name="add" size={16} color={tokens.light.pri} />
              </Pressable>
            </View>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Time off</Text>
        {(availability.data?.timeOff ?? []).map((t) => (
          <Card key={t.id} style={styles.timeOffCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeOffRange}>
                {t.startsOn} – {t.endsOn}
              </Text>
              <Text style={styles.timeOffMeta}>
                {t.reason ?? 'Time off'} · {t.pauseLeads ? 'Leads paused' : 'Demos only'}
              </Text>
            </View>
            <Pressable onPress={() => deleteTimeOff.mutate(t.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={tokens.light.bad} />
            </Pressable>
          </Card>
        ))}
        <Button title="+ Add time off" variant="outline" onPress={() => setSheetOpen(true)} />
      </ScrollView>
      {dirty ? (
        <StickyActionBar>
          <Button title="Save" onPress={onSaveGrid} loading={saveAvailability.isPending} />
        </StickyActionBar>
      ) : null}
      <TimeOffFormSheet
        visible={sheetOpen || !!clash}
        onCancel={() => setSheetOpen(false)}
        onSave={onSaveTimeOff}
        saving={addTimeOff.isPending}
        clash={clash}
        onConfirmForce={onConfirmForce}
        onChangeDates={() => {
          setClash(null);
          setPendingTimeOff(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  dayBlock: { marginBottom: 14 },
  dayLabel: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, marginBottom: 6 },
  windowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  windowText: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeInput: { flex: 1, height: 36, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.line, paddingHorizontal: 10, fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink },
  dash: { color: tokens.light.ink3 },
  addBtn: { width: 36, height: 36, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.light.pri, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginTop: 10, marginBottom: 10 },
  timeOffCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  timeOffRange: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  timeOffMeta: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 2 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginBottom: 8 },
});
