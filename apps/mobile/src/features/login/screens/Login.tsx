import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TextField, PhoneField, Tabs, Button } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useBootstrapQuery } from '../../platform/hooks';
import { useRequestOtpMutation, useEmailLoginMutation, useGoogleSignInMutation, applySession } from '../hooks';
import { signInWithGoogle } from '../googleSignIn';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Mirrors the prototype's 'login' screen: a Mobile OTP / Email tab switch,
// social sign-in below a divider, and the shared legal footer.
export function Login({ navigation, route }: Props) {
  const [tab, setTab] = useState<'otp' | 'email'>(route.params?.tab ?? 'otp');
  const [digits, setDigits] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  const bootstrap = useBootstrapQuery();
  const requestOtp = useRequestOtpMutation();
  const emailLogin = useEmailLoginMutation();
  const googleSignInMutation = useGoogleSignInMutation();

  function handleRegistrationRequired(err: ApiError) {
    const details = err.details as { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
    navigation.replace('RegistrationRouter', { registrationToken: details.registrationToken, contactType: details.contactType });
  }

  async function onSendOtp() {
    setError(undefined);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid Indian mobile number.');
      return;
    }
    const phone = `+91${digits}`;
    try {
      const result = await requestOtp.mutateAsync(phone);
      navigation.navigate('OtpVerify', { challengeId: result.challengeId, destination: phone });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  async function onSignIn() {
    setError(undefined);
    try {
      const result = await emailLogin.mutateAsync({ email, password });
      await applySession(result);
      navigation.replace('Home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
        handleRegistrationRequired(err);
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Incorrect email or password.');
    }
  }

  async function onGoogle() {
    const result = await signInWithGoogle();
    if ('idToken' in result) {
      try {
        const session = await googleSignInMutation.mutateAsync({ idToken: result.idToken });
        await applySession(session);
        navigation.replace('Home');
      } catch (err) {
        if (err instanceof ApiError && err.code === 'REGISTRATION_REQUIRED') {
          handleRegistrationRequired(err);
          return;
        }
        if (err instanceof ApiError && err.code === 'ROLE_MISMATCH') {
          Alert.alert('Different account role', 'This Google account is registered under a different role.');
          return;
        }
        Alert.alert('Sign-in failed', err instanceof ApiError ? err.message : 'Something went wrong.');
      }
    } else if ('notConfigured' in result) {
      Alert.alert("Google Sign-In isn't set up yet", 'Try phone or email instead.');
    }
  }

  const auth = bootstrap.data?.auth;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Sign in or create an account</Text>

        <Tabs
          tabs={[
            { key: 'otp', label: 'Mobile OTP' },
            { key: 'email', label: 'Email' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as 'otp' | 'email')}
        />

        {tab === 'otp' ? (
          <>
            <PhoneField value={digits} onChangeText={setDigits} error={error} />
            <Button title="Send OTP" onPress={onSendOtp} loading={requestOtp.isPending} />
          </>
        ) : (
          <>
            <TextField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextField label="Password" placeholder="••••••••••" secureTextEntry value={password} onChangeText={setPassword} error={error} />
            <Text style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
              Forgot password?
            </Text>
            <Button title="Sign in" onPress={onSignIn} loading={emailLogin.isPending} />
          </>
        )}

        {auth?.google ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialCol}>
              <Button title="Continue with Google" variant="outline" onPress={onGoogle} />
              <Button
                title="Continue with Apple"
                variant="dark"
                onPress={() => Alert.alert('Coming soon', "Apple Sign-In isn't available yet.")}
              />
            </View>
          </>
        ) : null}

        <Text style={styles.legal}>
          By continuing you agree to our <Text style={styles.legalLink}>Terms</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 20 },
  forgot: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.priInk, alignSelf: 'flex-end', marginTop: -8, marginBottom: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: tokens.light.line },
  dividerText: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  socialCol: { gap: 10 },
  legal: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, textAlign: 'center', marginTop: 24 },
  legalLink: { color: tokens.light.priInk, textDecorationLine: 'underline' },
});
