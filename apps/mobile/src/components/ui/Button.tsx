import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View, type PressableProps } from 'react-native';
import { tokens } from '../../theme/tokens';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'pri' | 'soft' | 'outline' | 'dark';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ title, variant = 'pri', loading, disabled, onPress, icon, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={isDisabled ? undefined : onPress}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'pri' || variant === 'dark' ? tokens.light.onPrimary : tokens.light.priInk} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.text, textVariant[variant]]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 50, borderRadius: tokens.radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 15, fontFamily: tokens.font.bodyBold },
  disabled: { opacity: 0.5 },
});

const variantStyles = StyleSheet.create({
  pri: { backgroundColor: tokens.light.pri },
  soft: { backgroundColor: tokens.light.priSoft },
  outline: { backgroundColor: tokens.light.surface, borderWidth: 1, borderColor: tokens.light.line },
  dark: { backgroundColor: '#000000' },
});

const textVariant = StyleSheet.create({
  pri: { color: tokens.light.onPrimary },
  soft: { color: tokens.light.priInk },
  outline: { color: tokens.light.ink },
  dark: { color: '#ffffff' },
});
