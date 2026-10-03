import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

export function OtpInput({ length, value, onChange, autoFocus }: OtpInputProps) {
  const digits = value.padEnd(length, ' ').split('');
  return (
    <View style={styles.container}>
      <TextInput
        testID="otp-input"
        style={styles.hidden}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
      />
      <View style={styles.boxes} pointerEvents="none">
        {digits.map((d, i) => (
          <View key={i} style={[styles.box, value.length === i && styles.boxActive]}>
            <Text style={styles.digit}>{d.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  hidden: { position: 'absolute', opacity: 0, height: 56, width: '100%' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 46,
    height: 56,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.light.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.light.surface,
  },
  boxActive: { borderColor: tokens.light.pri },
  digit: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink },
});
