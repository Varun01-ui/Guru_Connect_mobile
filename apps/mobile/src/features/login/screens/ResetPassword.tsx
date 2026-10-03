import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TextField, OtpInput, Button, StickyActionBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useResetPasswordMutation } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPassword({ route, navigation }: Props) {
  // The forgot-password endpoint never reveals a challengeId (so it can't confirm the account
  // exists). In dev, the console email provider logs the code alongside the challengeId, so this
  // field lets a developer paste it in manually; production needs the email template to carry it
  // via a deep link instead. Known v1.1 gap, not a blocker for this build.
  const [challengeId, setChallengeId] = useState(route.params.challengeId);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const reset = useResetPasswordMutation();

  async function onReset() {
    setError(undefined);
    try {
      await reset.mutateAsync({ challengeId, code, newPassword });
      navigation.navigate('Login', { tab: 'email' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Check your email</Text>
      <Text style={styles.helper}>Enter the code and a new password.</Text>
      {__DEV__ ? <TextField label="Dev only: challengeId" value={challengeId} onChangeText={setChallengeId} /> : null}
      <OtpInput length={6} value={code} onChange={setCode} />
      <View style={{ height: 16 }} />
      <TextField label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} error={error} />
      <Text style={styles.hint}>8+ characters, letters and numbers</Text>
      <StickyActionBar>
        <Button title="Reset password" onPress={onReset} loading={reset.isPending} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface, padding: 24 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, marginBottom: 24 },
  hint: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: -8, marginBottom: 16 },
});
