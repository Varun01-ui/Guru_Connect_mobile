import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { TopBar, TextField, Button, StickyActionBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { ApiError } from '../../../lib/api';
import { useTeacherProfileQuery, useSaveProfileMutation } from '../hooks';
import { formatFee, toPaise } from '../rules';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherProfileExperience'>;

export function TeacherProfileExperience({ navigation }: Props) {
  const profile = useTeacherProfileQuery();
  const save = useSaveProfileMutation();

  const [years, setYears] = useState(0);
  const [highest, setHighest] = useState('');
  const [fee, setFee] = useState('');
  const [demoAvailable, setDemoAvailable] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile.data || hydrated) return;
    const t = profile.data.teacher;
    setYears(t.experienceYears ?? 0);
    setHighest(t.highestQualification ?? '');
    setFee(formatFee(t.feePerHourPaise));
    setDemoAvailable(t.demoAvailable ?? true);
    setHydrated(true);
  }, [profile.data, hydrated]);

  async function onSave() {
    setError(undefined);
    if (!profile.data) return;
    try {
      await save.mutateAsync({
        body: { experienceYears: years, highestQualification: highest.trim(), feePerHourPaise: toPaise(fee), demoAvailable },
        ifMatch: profile.data.teacher.updatedAt,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Experience" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Experience in years</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepperBtn} onPress={() => setYears((v) => Math.max(0, v - 1))}>
            <Ionicons name="remove" size={18} color={tokens.light.ink} />
          </Pressable>
          <Text style={styles.stepperValue}>{years}</Text>
          <Pressable style={styles.stepperBtn} onPress={() => setYears((v) => Math.min(60, v + 1))}>
            <Ionicons name="add" size={18} color={tokens.light.ink} />
          </Pressable>
        </View>
        <TextField label="Highest qualification" value={highest} onChangeText={setHighest} />
        <TextField label="Indicative fee per hour (₹)" keyboardType="number-pad" value={fee} onChangeText={setFee} />
        <Pressable style={styles.demoRow} onPress={() => setDemoAvailable((v) => !v)}>
          <View style={[styles.switchTrack, demoAvailable && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, demoAvailable && styles.switchThumbOn]} />
          </View>
          <Text style={styles.demoLabel}>I offer a free demo class</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Save" onPress={onSave} loading={save.isPending} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 8, fontFamily: tokens.font.bodySemi },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 18, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, minWidth: 32, textAlign: 'center' },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  switchTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: tokens.light.surface3, padding: 2 },
  switchTrackOn: { backgroundColor: tokens.light.pri },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: tokens.light.surface },
  switchThumbOn: { marginLeft: 18 },
  demoLabel: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 4 },
});
