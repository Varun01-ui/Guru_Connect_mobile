import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Avatar, Button, ErrorState, Select, StickyActionBar, TextField, TopBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { tokens } from '../../../theme/tokens';
import { useAreasQuery, useMastersQuery } from '../../platform/hooks';
import { uploadErrorMessage } from '../../uploads/helpers';
import { pickSquarePhoto, uploadImage } from '../../uploads/upload';
import { useProfileQuery, useUpdateProfileMutation } from '../hooks';
import { diffProfile, validateFullName, type ProfileForm } from '../rules';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

function ReadOnlyRow({ label, value, onChange }: { label: string; value: string; onChange: () => void }) {
  return (
    <View style={styles.readRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.readLabel}>{label}</Text>
        <Text style={styles.readValue}>{value}</Text>
      </View>
      <Pressable onPress={onChange} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.change}>Change</Text>
      </Pressable>
    </View>
  );
}

export function EditProfile({ navigation }: Props) {
  const profile = useProfileQuery();
  const masters = useMastersQuery();
  const update = useUpdateProfileMutation();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  // null = photo untouched; { fileId: null } = remove it; otherwise a freshly uploaded file.
  const [photo, setPhoto] = useState<{ fileId: string | null; uri: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const areas = useAreasQuery(form?.cityId);

  useEffect(() => {
    if (form === null && profile.data) {
      setForm({ fullName: profile.data.fullName, cityId: profile.data.city?.id ?? '', areaId: profile.data.area?.id ?? '' });
    }
  }, [profile.data, form]);

  if (profile.isError && !profile.data) {
    return (
      <View style={styles.container}>
        <TopBar title="Edit profile" onBack={() => navigation.goBack()} />
        <ErrorState title="Couldn't load your profile" body="Check your connection and try again." onRetry={() => profile.refetch()} />
      </View>
    );
  }
  if (!profile.data || !form) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={tokens.light.pri} />
      </View>
    );
  }

  const original: ProfileForm = { fullName: profile.data.fullName, cityId: profile.data.city?.id ?? '', areaId: profile.data.area?.id ?? '' };
  const changes = diffProfile(original, form);
  const dirty = Object.keys(changes).length > 0 || photo !== null;
  const shownPhoto = photo ? photo.uri : profile.data.photoUrl;

  const cityOptions = (masters.data?.cities ?? []).map((c) => ({ label: c.name, value: c.id }));
  const areaOptions = (areas.data?.areas ?? []).map((a) => ({ label: a.name, value: a.id }));
  const soon = (what: string) => () => Alert.alert('Coming soon', `${what} isn't built yet.`);

  async function choosePhoto() {
    setPhotoError(undefined);
    try {
      const picked = await pickSquarePhoto();
      if (!picked) return;
      setUploading(true);
      const file = await uploadImage({ uri: picked.uri, purpose: 'avatar' });
      setPhoto({ fileId: file.fileId, uri: picked.uri });
    } catch (e) {
      setPhotoError(uploadErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  function onChangePhoto() {
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose from gallery', onPress: () => void choosePhoto() },
      ...(shownPhoto ? [{ text: 'Remove photo', onPress: () => setPhoto({ fileId: null, uri: null }) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  function back() {
    if (!dirty) return navigation.goBack();
    Alert.alert('Discard changes?', 'You have unsaved changes.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  async function onSave() {
    setFormError(undefined);
    const err = validateFullName(form!.fullName);
    setNameError(err);
    if (err) return;
    try {
      await update.mutateAsync({ input: photo ? { ...changes, profilePhotoFileId: photo.fileId } : changes, updatedAt: profile.data!.updatedAt });
      navigation.goBack();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'VERSION_CONFLICT') {
        setFormError('Updated on another device. Review and save again.');
        setForm(null);
        profile.refetch();
      } else setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Edit profile" onBack={back} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          <View>
            <Avatar name={form.fullName || profile.data.fullName} size={84} uri={shownPhoto} />
            {uploading ? (
              <View style={styles.avatarBusy}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
          <Pressable onPress={onChangePhoto} disabled={uploading} accessibilityRole="button">
            <Text style={styles.change}>{uploading ? 'Uploading…' : 'Change photo'}</Text>
          </Pressable>
          {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
        </View>

        <TextField label="Full name" placeholder="e.g. Lakshmi Venkatesh" value={form.fullName} onChangeText={(fullName) => setForm({ ...form, fullName })} error={nameError} />
        <Select
          label="City"
          placeholder="Choose a city"
          options={cityOptions}
          value={form.cityId || undefined}
          onChange={(cityId) => setForm({ ...form, cityId, areaId: cityId === form.cityId ? form.areaId : '' })}
        />
        <Select
          label="Area (optional)"
          placeholder="e.g. Koramangala"
          options={areaOptions}
          value={form.areaId || undefined}
          onChange={(areaId) => setForm({ ...form, areaId })}
          disabled={!form.cityId}
        />

        <View style={styles.divider} />
        <ReadOnlyRow label="Mobile" value={profile.data.phoneMasked} onChange={soon('Changing your number')} />
        {profile.data.emailMasked ? <ReadOnlyRow label="Email" value={profile.data.emailMasked} onChange={soon('Changing your email')} /> : null}

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Save changes" onPress={onSave} loading={update.isPending} disabled={!dirty || uploading} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingTop: 8 },
  avatarBusy: { ...StyleSheet.absoluteFill, borderRadius: 42, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  avatarBlock: { alignItems: 'center', gap: 8, marginBottom: 20 },
  change: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.priInk },
  divider: { height: 1, backgroundColor: tokens.light.line, marginVertical: 8 },
  readRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  readLabel: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3 },
  readValue: { fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink, marginTop: 2 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 12 },
});
