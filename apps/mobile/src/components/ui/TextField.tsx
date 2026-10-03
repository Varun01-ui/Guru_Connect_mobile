import React from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { tokens } from '../../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  rightAdornment?: React.ReactNode;
}

export function TextField({ label, error, rightAdornment, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error && styles.rowError]}>
        <TextInput style={[styles.input, style]} placeholderTextColor={tokens.light.ink3} {...rest} />
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
  input: { flex: 1, fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink, height: '100%' },
  error: { fontSize: 12, color: tokens.light.bad, marginTop: 4, fontFamily: tokens.font.body },
});
