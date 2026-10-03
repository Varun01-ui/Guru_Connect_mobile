import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { TopBar, Button, StickyActionBar, SectionHeader } from '../../../components/ui';
import { DocumentChecklistRow } from '../components/DocumentChecklistRow';
import { tokens } from '../../../theme/tokens';
import { useTeacherDocumentsQuery, useSubmitRegistrationMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherDocuments'>;

const REQUIRED: Array<'aadhaar' | 'pan' | 'education_certificate' | 'photo'> = ['aadhaar', 'pan', 'education_certificate', 'photo'];
const OPTIONAL: Array<'professional_certificate' | 'experience_letter'> = ['professional_certificate', 'experience_letter'];

export function TeacherDocuments({ navigation }: Props) {
  const docs = useTeacherDocumentsQuery();
  const submit = useSubmitRegistrationMutation();
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const documents = docs.data?.documents;
  const readyToSubmit = docs.data?.readyToSubmit ?? false;
  const uploadedRequired = REQUIRED.filter((t) => (t === 'education_certificate' ? (documents?.education_certificate.length ?? 0) > 0 : !!documents?.[t])).length;

  function docFor(type: string) {
    if (!documents) return null;
    if (type === 'education_certificate') return documents.education_certificate[0] ?? null;
    if (type === 'professional_certificate') return documents.professional_certificate[0] ?? null;
    if (type === 'experience_letter') return documents.experience_letter[0] ?? null;
    return (documents as any)[type] ?? null;
  }

  // TEACHER_REGISTRATION fee is disabled for this build (M43 payment gateway is
  // out of scope here); submit always goes straight through.
  async function onSubmit() {
    setError(undefined);
    try {
      await submit.mutateAsync(undefined);
      navigation.replace('TeacherRegistrationSubmitted');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <View style={styles.container}>
      <TopBar title="Upload your documents" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {REQUIRED.map((type) => (
          <DocumentChecklistRow key={type} docType={type} doc={docFor(type)} onPress={() => navigation.navigate('TeacherDocumentCapture', { docType: type })} />
        ))}
        <Pressable style={styles.optionalToggle} onPress={() => setShowOptional((v) => !v)}>
          <SectionHeader title="Optional" />
          <Ionicons name={showOptional ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.light.ink3} />
        </Pressable>
        {showOptional
          ? OPTIONAL.map((type) => (
              <DocumentChecklistRow key={type} docType={type} doc={docFor(type)} onPress={() => navigation.navigate('TeacherDocumentCapture', { docType: type })} />
            ))
          : null}
        <Text style={styles.summary}>
          {uploadedRequired} of {REQUIRED.length} required uploaded
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Submit for verification" onPress={onSubmit} loading={submit.isPending} disabled={!readyToSubmit} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  optionalToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  summary: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2, marginTop: 8, textAlign: 'center' },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 8, textAlign: 'center' },
});
