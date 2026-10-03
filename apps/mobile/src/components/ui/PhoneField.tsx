import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface PhoneFieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  editable?: boolean;
  rightAdornment?: React.ReactNode;
}

export function PhoneField({ label = 'Mobile number', value, onChangeText, error, editable = true, rightAdornment }: PhoneFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error && styles.rowError, !editable && styles.rowDisabled]}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="98450 14210"
          placeholderTextColor={tokens.light.ink3}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, ''))}
          editable={editable}
        />
        {rightAdornment}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 6, fontFamily: tokens.font.bodySemi },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.light.line,
    backgroundColor: tokens.light.surface,
    paddingHorizontal: 14,
  },
  rowError: { borderColor: tokens.light.bad },
  rowDisabled: { backgroundColor: tokens.light.surface2 },
  prefix: { fontSize: 15, color: tokens.light.ink2, marginRight: 8, fontFamily: tokens.font.bodySemi },
  input: { flex: 1, fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink },
  error: { fontSize: 12, color: tokens.light.bad, marginTop: 4, fontFamily: tokens.font.body },
});
