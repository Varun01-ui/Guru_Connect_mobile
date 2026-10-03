import React, { useState } from 'react';
import { View, Text, Image, Alert, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, TextField, Button, StickyActionBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { ApiError } from '../../../lib/api';
import { captureOrPickPhoto, uploadTeacherFile } from '../upload';
import { useCreateDocumentMutation } from '../hooks';
import { formatAadhaarInput, isValidAadhaar, isValidPan } from '../rules';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherDocumentCapture'>;

const TITLES: Record<string, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN card',
  education_certificate: 'Education certificate',
  professional_certificate: 'Professional certificate',
  experience_letter: 'Experience letter',
  photo: 'Verification photo',
};
const IDENTITY_TYPES = ['aadhaar', 'pan'];
const TITLED_TYPES = ['education_certificate', 'professional_certificate', 'experience_letter'];

export function TeacherDocumentCapture({ route, navigation }: Props) {
  const { docType } = route.params;
  const create = useCreateDocumentMutation();
  const [uri, setUri] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isIdentity = IDENTITY_TYPES.includes(docType);
  const needsTitle = TITLED_TYPES.includes(docType);
  const isPhotoType = docType === 'photo';

  const numberValid = docType === 'aadhaar' ? isValidAadhaar(docNumber) : docType === 'pan' ? isValidPan(docNumber) : true;
  const canUse = !!uri && numberValid && (!needsTitle || title.trim().length >= 2);

  async function pick(useCamera: boolean) {
    try {
      const result = await captureOrPickPhoto(useCamera);
      if (result) setUri(result.uri);
    } catch {
      Alert.alert('Something went wrong', 'Try taking the photo again.');
    }
  }

  async function onConfirm() {
    if (!uri) return;
    setError(undefined);
    setUploading(true);
    try {
      const fileId = await uploadTeacherFile({ uri, purpose: 'teacher_document', fileName: `${docType}.jpg` });
      await create.mutateAsync({
        docType,
        fileId,
        docNumber: isIdentity ? docNumber.replace(/\s/g, '') : undefined,
        title: needsTitle ? title.trim() : undefined,
      });
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("That didn't upload. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TopBar title={TITLES[docType] ?? docType} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {uri ? (
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{isPhotoType ? 'A clear, recent selfie — no filters or sunglasses.' : 'Take a clear photo of your document.'}</Text>
          </View>
        )}
        <View style={styles.pickRow}>
          <View style={{ flex: 1 }}>
            <Button title="Take photo" variant="outline" onPress={() => pick(true)} />
          </View>
          {!isPhotoType ? (
            <>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Button title="Choose from gallery" variant="outline" onPress={() => pick(false)} />
              </View>
            </>
          ) : null}
        </View>
        {docType === 'aadhaar' ? (
          <TextField
            label="Aadhaar number"
            placeholder="XXXX XXXX XXXX"
            keyboardType="number-pad"
            value={formatAadhaarInput(docNumber)}
            onChangeText={(v) => setDocNumber(v.replace(/\D/g, '').slice(0, 12))}
            error={docNumber.length === 12 && !numberValid ? 'Enter a valid 12-digit Aadhaar number' : undefined}
          />
        ) : null}
        {docType === 'pan' ? (
          <TextField
            label="PAN number"
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
            value={docNumber}
            onChangeText={(v) => setDocNumber(v.toUpperCase())}
            error={docNumber.length === 10 && !numberValid ? 'Enter a valid PAN, e.g. ABCDE1234F' : undefined}
          />
        ) : null}
        {isIdentity ? <Text style={styles.helper}>We only store the last 4 digits — never the full number.</Text> : null}
        {needsTitle ? <TextField label="Title" placeholder="e.g. B.Ed., Bangalore University 2010" value={title} onChangeText={setTitle} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Looks good — upload" onPress={onConfirm} loading={uploading} disabled={!canUse} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  preview: { width: '100%', height: 200, borderRadius: tokens.radii.lg, marginBottom: 16, backgroundColor: tokens.light.surface3 },
  placeholder: { height: 160, borderRadius: tokens.radii.lg, backgroundColor: tokens.light.surface3, alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 16 },
  placeholderText: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3, textAlign: 'center' },
  pickRow: { flexDirection: 'row', marginBottom: 16 },
  helper: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: -8, marginBottom: 16 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 8 },
});
