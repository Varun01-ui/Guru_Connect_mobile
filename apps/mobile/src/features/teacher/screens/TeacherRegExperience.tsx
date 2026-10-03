import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TextField, Button, StickyActionBar } from '../../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { useTeacherRegistrationQuery, useSaveBasicsMutation } from '../hooks';
import { containsContactInfo, formatFee, toPaise } from '../rules';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegExperience'>;

export function TeacherRegExperience({ navigation }: Props) {
  const reg = useTeacherRegistrationQuery();
  const save = useSaveBasicsMutation();

  const [years, setYears] = useState(0);
  const [highest, setHighest] = useState('');
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');
  const [demoAvailable, setDemoAvailable] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!reg.data || hydrated) return;
    const t = reg.data.teacher;
    setYears(t.experienceYears ?? 0);
    const highestQual = reg.data.qualifications.find((q) => q.isHighest);
    setHighest(t.highestQualification ?? highestQual?.degree ?? '');
    setBio(t.bio ?? '');
    setFee(formatFee(t.feePerHourPaise));
    setDemoAvailable(t.demoAvailable ?? true);
    setHydrated(true);
  }, [reg.data, hydrated]);

  const bioError = bio.length > 0 && containsContactInfo(bio) ? 'Remove phone numbers, emails or links' : undefined;
  const canSave = years >= 0 && highest.trim().length >= 2 && !bioError && !save.isPending;

  async function onNext() {
    setError(undefined);
    if (!reg.data) return;
    try {
      await save.mutateAsync({
        body: { experienceYears: years, highestQualification: highest.trim(), bio: bio.trim(), feePerHourPaise: toPaise(fee), demoAvailable },
        ifMatch: reg.data.teacher.updatedAt,
      });
      navigation.navigate('TeacherRegSubjects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <RegistrationProgressHeader step={3} title="Experience" onBack={() => navigation.goBack()} />
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
        <TextField label="Highest qualification" placeholder="M.Sc. Physics" value={highest} onChangeText={setHighest} />
        <TextField
          label={`About you (${bio.length}/2000)`}
          placeholder="I've taught JEE Physics for 14 years and focus on..."
          multiline
          numberOfLines={5}
          style={{ height: 110, paddingTop: 10 }}
          value={bio}
          onChangeText={setBio}
          error={bioError}
        />
        <TextField label="Indicative fee per hour (₹, optional)" placeholder="600" keyboardType="number-pad" value={fee} onChangeText={setFee} />
        <Pressable style={styles.demoRow} onPress={() => setDemoAvailable((v) => !v)}>
          <View style={[styles.switchTrack, demoAvailable && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, demoAvailable && styles.switchThumbOn]} />
          </View>
          <Text style={styles.demoLabel}>I offer a free demo class</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Next" onPress={onNext} loading={save.isPending} disabled={!canSave} />
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
