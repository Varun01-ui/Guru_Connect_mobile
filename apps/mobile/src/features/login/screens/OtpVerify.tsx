import React, { useEffect, useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { OtpInput, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useVerifyOtpMutation, useRequestOtpMutation, applySession } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

export function OtpVerify({ route, navigation }: Props) {
  const { challengeId: initialChallengeId, destination } = route.params;
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(30);
  const verify = useVerifyOtpMutation();
  const resend = useRequestOtpMutation();

  useEffect(() => {
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  async function onVerify(fullCode: string) {
    setError(undefined);
    try {
      const result = await verify.mutateAsync({ challengeId, code: fullCode });
      await applySession(result);
      navigation.replace('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
        const details = err.details as { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
        navigation.replace('RegistrationRouter', { registrationToken: details.registrationToken, contactType: details.contactType });
        return;
      }
      if (err instanceof ApiError && err.code === 'ROLE_MISMATCH') {
        Alert.alert('Different account role', 'This phone number is registered under a different role.');
        return;
      }
      if (err instanceof ApiError && err.code === 'OTP_INVALID') {
        const attemptsLeft = (err.details as { attemptsLeft?: number })?.attemptsLeft ?? 0;
        setCode('');
        setError(`Incorrect code. ${attemptsLeft} attempts left.`);
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    const result = await resend.mutateAsync(destination);
    setChallengeId(result.challengeId);
    setCooldown(30);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.heading}>Enter the 6-digit code</Text>
        <Text style={styles.helper}>
          Sent by SMS to {destination} <Text style={styles.change} onPress={() => navigation.goBack()}>Change</Text>
        </Text>
        <View style={{ height: 20 }} />
        <OtpInput length={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) onVerify(v); }} autoFocus />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={[styles.resend, cooldown > 0 && styles.resendDisabled]} onPress={onResend}>
          Didn't get it? Resend in{' '}
          <Text style={styles.resendBold}>0:{String(cooldown).padStart(2, '0')}</Text>
        </Text>
      </View>
      <StickyActionBar>
        <Button title="Verify and continue" onPress={() => onVerify(code)} loading={verify.isPending} disabled={code.length !== 6} />
      </StickyActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  change: { color: tokens.light.priInk, fontFamily: tokens.font.bodySemi },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 12 },
  resend: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 20 },
  resendDisabled: { opacity: 0.7 },
  resendBold: { fontFamily: tokens.font.bodyBold, color: tokens.light.ink2 },
});
