import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TextField, Select, Chip, Button, StickyActionBar } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { ApiError } from '../../../lib/api';
import { useMastersQuery } from '../../platform/hooks';
import { isAdultDateOfBirth } from '../rules';
import * as api from '../api';
import { fetchTeacherRegistration, patchTeacherBasics } from '../api';
import { useSession } from '../../../lib/session.store';
import { persistRefreshToken } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegBasics'>;

const GENDERS: { label: string; value: api.Gender }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'undisclosed' },
];

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Urdu', 'Odia'];

export function TeacherRegBasics({ route, navigation }: Props) {
  const registrationToken = (route.params as { registrationToken?: string } | undefined)?.registrationToken;
  const hasSession = useSession((s) => !!s.accessToken);
  const masters = useMastersQuery();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<api.Gender | undefined>();
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = (masters.data?.teacherCategories ?? []).map((c) => ({ label: c.name, value: c.id }));
  const dobValid = dob.length === 0 || isAdultDateOfBirth(dob);
  const canSubmit = !!fullName.trim() && !!gender && isAdultDateOfBirth(dob) && !!categoryId && !submitting;

  function toggleLanguage(name: string) {
    setLanguages((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]));
  }

  async function onNext() {
    setError(undefined);
    setSubmitting(true);
    try {
      if (!hasSession) {
        if (!registrationToken) throw new Error('Missing registration token');
        const idempotencyKey = `${registrationToken.slice(0, 24)}-teacher-reg`;
        const result = await api.registerTeacher(
          registrationToken,
          { fullName: fullName.trim(), gender: gender!, dateOfBirth: dob, categoryId: categoryId! },
          idempotencyKey,
        );
        useSession.getState().setSession({ accessToken: result.accessToken, userId: result.teacherId, role: 'teacher', profileId: result.teacherId });
        await persistRefreshToken(result.refreshToken);
      }
      if (email.trim() || languages.length > 0) {
        const current = await fetchTeacherRegistration();
        await patchTeacherBasics({ email: email.trim() || null, languages: languages.length > 0 ? languages : undefined }, current.teacher.updatedAt);
      }
      navigation.replace('TeacherRegQualifications');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT_STATE') {
        navigation.replace('Login');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <RegistrationProgressHeader step={1} title="Personal details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextField label="Full name" placeholder="As on your Aadhaar" value={fullName} onChangeText={setFullName} />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.segmented}>
          {GENDERS.map((g) => (
            <Pressable key={g.value} style={[styles.segment, gender === g.value && styles.segmentOn]} onPress={() => setGender(g.value)}>
              <Text style={[styles.segmentText, gender === g.value && styles.segmentTextOn]}>{g.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextField
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
          keyboardType="numbers-and-punctuation"
          error={!dobValid ? 'You must be at least 18 to register as a teacher' : undefined}
        />
        <TextField label="Email (optional)" placeholder="ananya.iyer@gmail.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Select label="Category" placeholder="Choose a category" options={categoryOptions} value={categoryId} onChange={setCategoryId} />
        <Text style={styles.label}>Languages</Text>
        <View style={styles.chipWrap}>
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={languages.includes(l)} onPress={() => toggleLanguage(l)} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Next" onPress={onNext} loading={submitting} disabled={!canSubmit} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 8, fontFamily: tokens.font.bodySemi },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  segment: { paddingHorizontal: 14, height: 40, borderRadius: tokens.radii.pill, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: tokens.light.priSoft, borderColor: tokens.light.pri },
  segmentText: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  segmentTextOn: { color: tokens.light.priInk },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 4 },
});
