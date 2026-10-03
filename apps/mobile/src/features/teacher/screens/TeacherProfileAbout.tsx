import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, TextField, Select, Chip, Button, StickyActionBar, Avatar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { ApiError } from '../../../lib/api';
import { useMastersQuery } from '../../platform/hooks';
import { useTeacherProfileQuery, useSaveProfileMutation } from '../hooks';
import { containsContactInfo } from '../rules';
import { pickSquarePhoto } from '../../uploads/upload';
import { uploadTeacherFile } from '../upload';
import { uploadErrorMessage } from '../../uploads/helpers';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherProfileAbout'>;

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Urdu', 'Odia'];

export function TeacherProfileAbout({ navigation }: Props) {
  const profile = useTeacherProfileQuery();
  const masters = useMastersQuery();
  const save = useSaveProfileMutation();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFileId, setPhotoFileId] = useState<string | undefined>();
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile.data || hydrated) return;
    setPhotoUrl(profile.data.teacher.photoUrl);
    setBio(profile.data.teacher.bio ?? '');
    setLanguages(profile.data.teacher.languages ?? []);
    setCategoryId(profile.data.teacher.categoryId);
    setHydrated(true);
  }, [profile.data, hydrated]);

  const categoryOptions = (masters.data?.teacherCategories ?? []).map((c) => ({ label: c.name, value: c.id }));
  const bioError = bio.length > 0 && containsContactInfo(bio) ? 'Remove phone numbers, emails or links' : undefined;
  const canSave = !bioError && !save.isPending;

  function toggleLanguage(name: string) {
    setLanguages((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]));
  }

  async function onChangePhoto() {
    try {
      const picked = await pickSquarePhoto();
      if (!picked) return;
      setUploadingPhoto(true);
      const fileId = await uploadTeacherFile({ uri: picked.uri, purpose: 'teacher_photo', fileName: 'profile.jpg' });
      setPhotoFileId(fileId);
      setPhotoUrl(picked.uri);
    } catch (err) {
      Alert.alert('Upload failed', uploadErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSave() {
    setError(undefined);
    if (!profile.data) return;
    try {
      await save.mutateAsync({
        body: { bio: bio.trim(), languages, categoryId, profilePhotoFileId: photoFileId },
        ifMatch: profile.data.teacher.updatedAt,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="About" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.photoRow} onPress={onChangePhoto}>
          <Avatar name={profile.data?.teacher.fullName ?? ''} uri={photoUrl} size={72} radius={22} />
          <Text style={styles.photoHint}>{uploadingPhoto ? 'Uploading…' : 'Tap to change photo'}</Text>
        </Pressable>
        <TextField
          label={`Bio (${bio.length}/2000)`}
          placeholder="Parents see the first two lines in search — make them count"
          multiline
          numberOfLines={5}
          style={{ height: 110, paddingTop: 10 }}
          value={bio}
          onChangeText={setBio}
          error={bioError}
        />
        <Select label="Category" options={categoryOptions} value={categoryId} onChange={setCategoryId} />
        <Text style={styles.label}>Languages</Text>
        <View style={styles.chipWrap}>
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={languages.includes(l)} onPress={() => toggleLanguage(l)} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Save" onPress={onSave} loading={save.isPending} disabled={!canSave} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  photoRow: { alignItems: 'center', gap: 8, marginBottom: 20 },
  photoHint: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.priInk },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 8, fontFamily: tokens.font.bodySemi },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 4 },
});
