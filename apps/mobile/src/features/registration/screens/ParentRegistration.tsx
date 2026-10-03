import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, TextField, PhoneField, Select, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useMastersQuery, useAreasQuery } from '../../platform/hooks';
import { applySession } from '../../login/hooks';
import { useRegistrationDraft } from '../useRegistrationDraft';
import { tokens } from '../../../theme/tokens';
import * as api from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentRegistration'>;

interface Draft {
  fullName: string;
  mobile: string;
  email: string;
  stateId: string;
  cityId: string;
  areaId: string;
  referralCode: string;
}

// Mirrors the prototype's 'reg-parent' screen: name, verified mobile, email,
// a state/city row, and an inline (optional) referral code field.
export function ParentRegistration({ route, navigation }: Props) {
  const { registrationToken } = route.params;
  const context = useQuery({
    queryKey: ['registration', 'context', registrationToken],
    queryFn: () => api.fetchRegistrationContext(registrationToken),
  });
  const [draft, updateField, clearDraft] = useRegistrationDraft<Draft>('parent', registrationToken);
  const masters = useMastersQuery();
  const areas = useAreasQuery(draft.cityId);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isPhoneVerified = context.data?.contactType === 'phone';

  useEffect(() => {
    if (isPhoneVerified && context.data && !draft.mobile) {
      updateField('mobile', context.data.verifiedValue);
    }
  }, [isPhoneVerified, context.data]);

  const stateOptions = (masters.data?.states ?? []).map((s) => ({ label: s.name, value: s.id }));
  const cityOptions = (masters.data?.cities ?? []).filter((c) => c.stateId === draft.stateId).map((c) => ({ label: c.name, value: c.id }));
  const areaOptions = (areas.data?.areas ?? []).map((a) => ({ label: a.name, value: a.id }));

  const canSubmit = !!draft.fullName && !!draft.mobile && !!draft.stateId && !!draft.cityId && !submitting;

  async function onSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      const idempotencyKey = `${registrationToken.slice(0, 24)}-parent-reg`;
      const result = await api.registerParent(
        registrationToken,
        {
          fullName: draft.fullName ?? '',
          mobile: (draft.mobile ?? '').startsWith('+91') ? draft.mobile! : `+91${draft.mobile ?? ''}`,
          email: draft.email || undefined,
          stateId: draft.stateId ?? '',
          cityId: draft.cityId ?? '',
          areaId: draft.areaId || undefined,
          marketingOptIn: false,
          referralCode: draft.referralCode || undefined,
        },
        idempotencyKey,
      );
      await applySession(result);
      clearDraft();
      navigation.replace('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT_DUPLICATE') {
        setError('An account already exists with this phone number.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const mobileDigits = (draft.mobile ?? '').replace('+91', '');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Create parent account" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextField label="Full name" placeholder="Lakshmi Venkatesh" value={draft.fullName ?? ''} onChangeText={(v) => updateField('fullName', v)} />
        <PhoneField
          value={mobileDigits}
          onChangeText={(v) => updateField('mobile', v)}
          editable={!isPhoneVerified}
          rightAdornment={isPhoneVerified ? <Text style={styles.verifiedCheck}>✓</Text> : undefined}
        />
        <TextField label="Email" placeholder="lakshmi.v@gmail.com" autoCapitalize="none" keyboardType="email-address" value={draft.email ?? ''} onChangeText={(v) => updateField('email', v)} />
        <View style={styles.row2}>
          <Select
            label="State"
            placeholder="Karnataka"
            options={stateOptions}
            value={draft.stateId}
            onChange={(v) => {
              updateField('stateId', v);
              updateField('cityId', '');
              updateField('areaId', '');
            }}
          />
          <View style={{ width: 12 }} />
          <Select
            label="City"
            placeholder="Bengaluru"
            options={cityOptions}
            value={draft.cityId}
            onChange={(v) => {
              updateField('cityId', v);
              updateField('areaId', '');
            }}
            disabled={!draft.stateId}
          />
        </View>
        {areaOptions.length > 0 ? (
          <Select label="Area (optional)" placeholder="Koramangala" options={areaOptions} value={draft.areaId} onChange={(v) => updateField('areaId', v)} disabled={!draft.cityId} />
        ) : null}
        <TextField
          label="Referral code (optional)"
          placeholder="e.g. LAKSHMI50"
          autoCapitalize="characters"
          value={draft.referralCode ?? ''}
          onChangeText={(v) => updateField('referralCode', v.toUpperCase())}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Create account" onPress={onSubmit} loading={submitting} disabled={!canSubmit} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24, paddingTop: 4 },
  row2: { flexDirection: 'row' },
  verifiedCheck: { color: tokens.light.good, fontSize: 16, fontFamily: tokens.font.bodyBold, paddingLeft: 8 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 4 },
});
