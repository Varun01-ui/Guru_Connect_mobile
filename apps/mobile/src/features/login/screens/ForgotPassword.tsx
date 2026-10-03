import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TextField, Button, StickyActionBar } from '../../../components/ui';
import { useForgotPasswordMutation } from '../hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPassword({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const forgot = useForgotPasswordMutation();

  async function onSend() {
    await forgot.mutateAsync(email);
    navigation.navigate('ResetPassword', { challengeId: '', email });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.helper}>Enter the email on your account. We'll send you a code.</Text>
      <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <StickyActionBar>
        <Button title="Send code" onPress={onSend} loading={forgot.isPending} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface, padding: 24 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 6 },
  helper: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, marginBottom: 24 },
});
